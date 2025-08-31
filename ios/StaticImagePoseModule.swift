import Foundation
import React
import UIKit
import MediaPipeTasksVision

@objc(StaticImagePoseModule)
class StaticImagePoseModule: NSObject {
    
    private var poseLandmarkerService: PoseLandmarkerService?
    
    override init() {
        super.init()
        setupPoseLandmarkerService()
    }
    
    private func setupPoseLandmarkerService() {
        let modelPath = Bundle.main.path(forResource: "pose_landmarker_full", ofType: "task")
        poseLandmarkerService = PoseLandmarkerService.stillImageLandmarkerService(
            modelPath: modelPath,
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            delegate: InferenceConfigurationManager.sharedInstance.delegate
        )
    }
    
    @objc func detectPoseFromImage(_ imageUri: String, 
                                  resolver: @escaping RCTPromiseResolveBlock, 
                                  rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let url = URL(string: imageUri) else {
            rejecter("INVALID_URI", "Invalid image URI provided", nil)
            return
        }
        
        // Load image from URI
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else {
                rejecter("MODULE_DEALLOCATED", "Module was deallocated", nil)
                return
            }
            
            do {
                let imageData: Data
                
                if url.isFileURL {
                    // Local file
                    imageData = try Data(contentsOf: url)
                } else {
                    // Remote URL
                    imageData = try Data(contentsOf: url)
                }
                
                guard let image = UIImage(data: imageData) else {
                    DispatchQueue.main.async {
                        rejecter("IMAGE_LOAD_ERROR", "Failed to create UIImage from data", nil)
                    }
                    return
                }
                
                // Detect pose
                guard let resultBundle = self.poseLandmarkerService?.detect(image: image),
                      let result = resultBundle.poseLandmarkerResults.first,
                      let poseLandmarkerResult = result,
                      let landmarks = poseLandmarkerResult.landmarks.first else {
                    DispatchQueue.main.async {
                        rejecter("NO_POSE_DETECTED", "No pose landmarks detected in the image", nil)
                    }
                    return
                }
                
                // Convert landmarks to dictionary format
                var landmarksArray: [[String: Any]] = []
                
                for landmark in landmarks {
                    let landmarkData: [String: Any] = [
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility?.floatValue ?? 0.0,
                        "presence": landmark.presence?.floatValue ?? 0.0
                    ]
                    landmarksArray.append(landmarkData)
                }
                
                let resultDict: [String: Any] = [
                    "landmarks": landmarksArray,
                    "imageWidth": image.size.width,
                    "imageHeight": image.size.height
                ]
                
                DispatchQueue.main.async {
                    resolver(resultDict)
                }
                
            } catch {
                DispatchQueue.main.async {
                    rejecter("DETECTION_ERROR", "Error detecting pose: \(error.localizedDescription)", error)
                }
            }
        }
    }
    
    @objc func detectPoseFromBase64(_ base64String: String,
                                   resolver: @escaping RCTPromiseResolveBlock,
                                   rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let imageData = Data(base64Encoded: base64String),
              let image = UIImage(data: imageData) else {
            rejecter("IMAGE_DECODE_ERROR", "Failed to decode base64 image", nil)
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else {
                DispatchQueue.main.async {
                    rejecter("MODULE_DEALLOCATED", "Module was deallocated", nil)
                }
                return
            }
            
            // Detect pose
            guard let resultBundle = self.poseLandmarkerService?.detect(image: image),
                  let result = resultBundle.poseLandmarkerResults.first,
                  let poseLandmarkerResult = result,
                  let landmarks = poseLandmarkerResult.landmarks.first else {
                DispatchQueue.main.async {
                    rejecter("NO_POSE_DETECTED", "No pose landmarks detected in the image", nil)
                }
                return
            }
            
            // Convert landmarks to dictionary format
            var landmarksArray: [[String: Any]] = []
            
            for landmark in landmarks {
                let landmarkData: [String: Any] = [
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility?.floatValue ?? 0.0,
                    "presence": landmark.presence?.floatValue ?? 0.0
                ]
                landmarksArray.append(landmarkData)
            }
            
            let resultDict: [String: Any] = [
                "landmarks": landmarksArray,
                "imageWidth": image.size.width,
                "imageHeight": image.size.height
            ]
            
            DispatchQueue.main.async {
                resolver(resultDict)
            }
        }
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
