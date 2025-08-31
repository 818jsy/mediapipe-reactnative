package com.tsmediapipe

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mediapipe.tasks.vision.core.RunningMode
import java.io.ByteArrayOutputStream
import java.io.InputStream

class StaticImagePoseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val TAG = "StaticImagePoseModule"
  }

  override fun getName(): String {
    return "StaticImagePose"
  }

  @ReactMethod
  fun detectPoseFromImage(imageUri: String, promise: Promise) {
    try {
      val bitmap = loadBitmapFromUri(imageUri)
      if (bitmap == null) {
        promise.reject("IMAGE_LOAD_ERROR", "Failed to load image from URI: $imageUri")
        return
      }

      // Create PoseLandmarkerHelper for static image processing
      val poseLandmarkerHelper = PoseLandmarkerHelper(
        runningMode = RunningMode.IMAGE,
        context = reactApplicationContext
      )

      val result = poseLandmarkerHelper.detectImage(bitmap)
      
      if (result != null && result.landmarks().isNotEmpty()) {
        val landmarks = result.landmarks()[0] // Get first person's landmarks
        val landmarkArray = WritableNativeArray()
        
        for (landmark in landmarks) {
          val landmarkMap = WritableNativeMap()
          landmarkMap.putDouble("x", landmark.x().toDouble())
          landmarkMap.putDouble("y", landmark.y().toDouble())
          landmarkMap.putDouble("z", landmark.z().toDouble())
          landmarkMap.putDouble("visibility", landmark.visibility().orElse(0.0f).toDouble())
          landmarkArray.pushMap(landmarkMap)
        }
        
        val resultMap = WritableNativeMap()
        resultMap.putArray("landmarks", landmarkArray)
        resultMap.putInt("imageWidth", bitmap.width)
        resultMap.putInt("imageHeight", bitmap.height)
        
        promise.resolve(resultMap)
      } else {
        promise.reject("NO_POSE_DETECTED", "No pose landmarks detected in the image")
      }
      
      // Clean up
      poseLandmarkerHelper.clearPoseLandmarker()
      bitmap.recycle()
      
    } catch (e: Exception) {
      Log.e(TAG, "Error detecting pose from image", e)
      promise.reject("DETECTION_ERROR", "Error detecting pose: ${e.message}")
    }
  }

  @ReactMethod
  fun detectPoseFromBase64(base64String: String, promise: Promise) {
    try {
      val bitmap = loadBitmapFromBase64(base64String)
      if (bitmap == null) {
        promise.reject("IMAGE_DECODE_ERROR", "Failed to decode base64 image")
        return
      }

      // Create PoseLandmarkerHelper for static image processing
      val poseLandmarkerHelper = PoseLandmarkerHelper(
        runningMode = RunningMode.IMAGE,
        context = reactApplicationContext
      )

      val result = poseLandmarkerHelper.detectImage(bitmap)
      
      if (result != null && result.landmarks().isNotEmpty()) {
        val landmarks = result.landmarks()[0] // Get first person's landmarks
        val landmarkArray = WritableNativeArray()
        
        for (landmark in landmarks) {
          val landmarkMap = WritableNativeMap()
          landmarkMap.putDouble("x", landmark.x().toDouble())
          landmarkMap.putDouble("y", landmark.y().toDouble())
          landmarkMap.putDouble("z", landmark.z().toDouble())
          landmarkMap.putDouble("visibility", landmark.visibility().orElse(0.0f).toDouble())
          landmarkArray.pushMap(landmarkMap)
        }
        
        val resultMap = WritableNativeMap()
        resultMap.putArray("landmarks", landmarkArray)
        resultMap.putInt("imageWidth", bitmap.width)
        resultMap.putInt("imageHeight", bitmap.height)
        
        promise.resolve(resultMap)
      } else {
        promise.reject("NO_POSE_DETECTED", "No pose landmarks detected in the image")
      }
      
      // Clean up
      poseLandmarkerHelper.clearPoseLandmarker()
      bitmap.recycle()
      
    } catch (e: Exception) {
      Log.e(TAG, "Error detecting pose from base64 image", e)
      promise.reject("DETECTION_ERROR", "Error detecting pose: ${e.message}")
    }
  }

  private fun loadBitmapFromUri(imageUri: String): Bitmap? {
    return try {
      val uri = Uri.parse(imageUri)
      val inputStream: InputStream? = reactApplicationContext.contentResolver.openInputStream(uri)
      BitmapFactory.decodeStream(inputStream)
    } catch (e: Exception) {
      Log.e(TAG, "Error loading bitmap from URI: $imageUri", e)
      null
    }
  }

  private fun loadBitmapFromBase64(base64String: String): Bitmap? {
    return try {
      val imageBytes = Base64.decode(base64String, Base64.DEFAULT)
      BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
    } catch (e: Exception) {
      Log.e(TAG, "Error decoding base64 image", e)
      null
    }
  }
}
