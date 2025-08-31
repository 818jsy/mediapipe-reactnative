import * as React from 'react';
import { useState } from 'react';

import {
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Dimensions,
  View,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { RNMediapipe, switchCamera, detectPoseFromImage } from '@thinksys/react-native-mediapipe';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import PoseOverlay from './PoseOverlay';

export default function App() {
  const { width, height } = Dimensions.get('window');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);

  const onFlip = () => {
    switchCamera();
  };

  const handleLandmark = (data: any) => {
    console.log('Body Landmark Data:', data);
  };

  const selectImage = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        console.log('Image selection cancelled or error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
          detectPose(imageUri);
        }
      }
    });
  };

  const detectPose = async (imageUri: string) => {
    setIsProcessing(true);
    setPoseResult(null);

    try {
      const result = await detectPoseFromImage(imageUri);
      console.log('Pose detection result:', result);
      setPoseResult(result);
      Alert.alert(
        'Pose Detection Success',
        `Found ${result.landmarks?.length || 0} landmarks`
      );
    } catch (error: any) {
      console.error('Pose detection error:', error);
      Alert.alert('Error', error.message || 'Failed to detect pose');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMode = () => {
    setShowCamera(!showCamera);
    setSelectedImage(null);
    setPoseResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
            <Text style={styles.btnTxt}>
              {showCamera ? 'Switch to Image Mode' : 'Switch to Camera Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {showCamera ? (
          <>
            <RNMediapipe
              style={styles.tsMediapipeView}
              width={width}
              height={height * 0.7}
              onLandmark={handleLandmark}
              face={true}
              leftArm={true}
              rightArm={true}
              leftWrist={true}
              rightWrist={true}
              torso={true}
              leftLeg={true}
              rightLeg={true}
              leftAnkle={true}
              rightAnkle={true}
              frameLimit={25}
            />
            <TouchableOpacity onPress={onFlip} style={styles.btnView}>
              <Text style={styles.btnTxt}>Switch Camera</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.imageContainer}>
            {selectedImage && (
              <View style={styles.imageWithOverlay}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.selectedImage}
                  resizeMode="contain"
                />
                {poseResult && poseResult.landmarks && (
                  <PoseOverlay
                    landmarks={poseResult.landmarks}
                    imageWidth={poseResult.imageWidth}
                    imageHeight={poseResult.imageHeight}
                    displayWidth={300}
                    displayHeight={400}
                  />
                )}
              </View>
            )}
            
            <TouchableOpacity 
              onPress={selectImage} 
              style={[styles.btnView, { position: 'relative', bottom: 20 }]}
              disabled={isProcessing}
            >
              <Text style={styles.btnTxt}>
                {isProcessing ? 'Processing...' : 'Select Image'}
              </Text>
            </TouchableOpacity>

            {poseResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Pose Detection Result:</Text>
                <Text style={styles.resultText}>
                  Landmarks: {poseResult.landmarks?.length || 0}
                </Text>
                <Text style={styles.resultText}>
                  Image Size: {poseResult.imageWidth} x {poseResult.imageHeight}
                </Text>
                <Text style={styles.resultText}>
                  🟡 Face  🔵 Arms/Torso  🩷 Legs
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  toggleContainer: {
    padding: 20,
    alignItems: 'center',
  },
  toggleBtn: {
    backgroundColor: 'blue',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnView: {
    width: 150,
    height: 60,
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 42,
  },
  btnTxt: { 
    color: 'white',
    fontWeight: 'bold',
  },
  tsMediapipeView: {
    alignSelf: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageWithOverlay: {
    position: 'relative',
    marginBottom: 20,
  },
  selectedImage: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
  },
  resultContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
});
