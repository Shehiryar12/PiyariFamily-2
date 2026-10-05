package com.piyarifamily

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ScreenSecurityModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "ScreenSecurity"
    const val EVENT_NAME = "ScreenSecurityCapture"
  }

  private var captureCallback: Activity.ScreenCaptureCallback? = null

  override fun getName() = NAME

  @ReactMethod
  fun setSecure(enable: Boolean) {
    val activity = reactContext.currentActivity ?: return

    activity.runOnUiThread {
      try {
        val window = activity.window ?: return@runOnUiThread
        if (enable) {
          window.setFlags(
              WindowManager.LayoutParams.FLAG_SECURE,
              WindowManager.LayoutParams.FLAG_SECURE,
          )
          registerCaptureCallback(activity)
        } else {
          window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
          unregisterCaptureCallback(activity)
        }
      } catch (_: Exception) {
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter on Android
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter on Android
  }

  private fun registerCaptureCallback(activity: Activity) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE || captureCallback != null) {
        return
      }

      val callback = Activity.ScreenCaptureCallback {
        emitCapture("screenshot")
      }
      captureCallback = callback
      activity.registerScreenCaptureCallback(activity.mainExecutor, callback)
    } catch (_: Exception) {
      captureCallback = null
    }
  }

  private fun unregisterCaptureCallback(activity: Activity) {
    val callback = captureCallback ?: return
    captureCallback = null

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        activity.unregisterScreenCaptureCallback(callback)
      }
    } catch (_: Exception) {
    }
  }

  private fun emitCapture(type: String) {
    if (!reactContext.hasActiveReactInstance()) {
      return
    }

    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_NAME, type)
  }
}
