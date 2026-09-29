import React
import UIKit

@objc(ScreenSecurity)
class ScreenSecurity: RCTEventEmitter {
  private var isSecure = false
  private var hasListeners = false
  private var blockView: UIView?

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["ScreenSecurityCapture"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc func setSecure(_ enable: Bool) {
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }

      if enable {
        self.enableProtection()
      } else {
        self.disableProtection()
      }
    }
  }

  private func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }

  private func enableProtection() {
    guard !isSecure else {
      return
    }

    isSecure = true
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleScreenshot),
      name: UIApplication.userDidTakeScreenshotNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleCaptureChange),
      name: UIScreen.capturedDidChangeNotification,
      object: nil
    )

    if UIScreen.main.isCaptured {
      showRecordingBlocker()
      emit("recording")
    }
  }

  private func disableProtection() {
    guard isSecure else {
      return
    }

    isSecure = false
    NotificationCenter.default.removeObserver(self)
    hideRecordingBlocker()
  }

  private func showRecordingBlocker() {
    guard let window = keyWindow(), blockView == nil else {
      return
    }

    let overlay = UIView(frame: window.bounds)
    overlay.backgroundColor = UIColor(red: 0.42, green: 0.016, blue: 0.114, alpha: 1)
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.isUserInteractionEnabled = true
    window.addSubview(overlay)
    blockView = overlay
  }

  private func hideRecordingBlocker() {
    blockView?.removeFromSuperview()
    blockView = nil
  }

  @objc private func handleScreenshot() {
    emit("screenshot")
  }

  @objc private func handleCaptureChange() {
    if UIScreen.main.isCaptured {
      showRecordingBlocker()
      emit("recording")
    } else {
      hideRecordingBlocker()
      emit("recording-end")
    }
  }

  private func emit(_ type: String) {
    guard hasListeners else {
      return
    }

    sendEvent(withName: "ScreenSecurityCapture", body: type)
  }
}
