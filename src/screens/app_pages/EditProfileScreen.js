import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker"; // Ensure this is installed
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// API & Context
import { useTheme } from "../../context/ThemeContext";
import { updateProfileApi } from "../../services/auth.api"; // Check path

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [userInfo, setUserInfo] = useState({});
  const [name, setName] = useState("");
  const [image, setImage] = useState(null); // Stores local URI
  const [loading, setLoading] = useState(false);

  // Load User Data
  useEffect(() => {
    const loadUser = async () => {
      const json = await AsyncStorage.getItem("userInfo");
      if (json) {
        const data = JSON.parse(json);
        const user = data.user || data;
        setUserInfo(user);
        setName(user.name || "");
        setImage(user.avatar || null);
      }
    };
    loadUser();
  }, []);

  // Handle Image Selection
  const pickImage = async () => {
    // Permission check
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to update your profile."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name cannot be empty");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);

      // If image changed (it's a local filesystem URI)
      if (image && image !== userInfo.avatar) {
        const uri = image;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("avatar", {
          uri: uri,
          name: filename,
          type: type,
        });
      }

      const { data } = await updateProfileApi(formData);

      // Update Local Storage
      // We need to keep the 'token' but update the 'user' object
      const oldData = JSON.parse(await AsyncStorage.getItem("userInfo"));
      const newData = { ...oldData, user: data.user || data }; // Adjust based on your API response structure

      await AsyncStorage.setItem("userInfo", JSON.stringify(newData));

      Alert.alert("Success", "Profile Updated!");
      navigation.goBack(); // Go back to Settings
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = {
    header: {
      backgroundColor: theme.bgCard,
      borderBottomColor: theme.inputBorder,
    },
    textPrimary: { color: theme.textPrimary },
    textSecondary: { color: theme.textSecondary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
    disabledInput: { opacity: 0.5 },
    saveBtn: { backgroundColor: theme.accentGreen },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>
            Edit Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.avatarWrapper,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBg,
                },
              ]}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.avatarImg} />
              ) : (
                <Text style={{ fontSize: 36, color: theme.textSecondary }}>
                  {name?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
              {/* Overlay */}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text
              style={[styles.changePhotoText, { color: theme.accentGreen }]}
            >
              Tap to change photo
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, dynamicStyles.textSecondary]}>
              Full Name
            </Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={[styles.formGroup, styles.disabledGroup]}>
            <Text style={[styles.label, dynamicStyles.textSecondary]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                dynamicStyles.input,
                dynamicStyles.disabledInput,
              ]}
              value={userInfo.email || ""}
              editable={false}
            />
            <Text style={[styles.infoText, dynamicStyles.textSecondary]}>
              Email cannot be changed
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, dynamicStyles.saveBtn]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  formGroup: {
    width: "100%",
    marginBottom: 20,
    gap: 8,
  },
  label: {
    fontSize: 13,
    marginLeft: 4,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoText: {
    fontSize: 11,
    marginLeft: 4,
    opacity: 0.7,
  },
  footer: {
    padding: 20,
  },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditProfileScreen;
