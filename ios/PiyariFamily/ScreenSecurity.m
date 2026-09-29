#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ScreenSecurity, RCTEventEmitter)
RCT_EXTERN_METHOD(setSecure:(BOOL)enable)
@end
