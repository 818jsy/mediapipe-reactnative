#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StaticImagePoseModule, NSObject)

RCT_EXTERN_METHOD(detectPoseFromImage:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(detectPoseFromBase64:(NSString *)base64String
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
