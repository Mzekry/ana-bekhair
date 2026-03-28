import { MaterialIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { WatcherContact, useApp } from "@/contexts/AppContext";

const PHONE_REGEX = /^\+[0-9]{10,15}$/;

export default function EditContactScreen() {
  const insets = useSafeAreaInsets();
  const { contact, setContact } = useApp();

  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20;

  const handleImportContacts = async () => {
    if (Platform.OS === "web") {
      Alert.alert("غير متاح", "استيراد جهات الاتصال غير متاح على الويب");
      return;
    }
    setLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("تنبيه", "لم يتم منح إذن الوصول لجهات الاتصال");
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      setContactsList(
        data.filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
      );
      setShowContacts(true);
    } catch {
      Alert.alert("خطأ", "تعذر تحميل جهات الاتصال");
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (c: Contacts.Contact) => {
    const rawPhone = c.phoneNumbers?.[0]?.number ?? "";
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
    setName(c.name ?? "");
    setPhone(cleanPhone);
    setPhoneError("");
    setShowContacts(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال الاسم");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError("رقم الهاتف غير صحيح (يجب أن يبدأ بـ + ويحتوي على 10-15 رقم)");
      return;
    }
    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const w: WatcherContact = { name: name.trim(), phone: phone.trim() };
      await setContact(w);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 8, paddingBottom: botPad }]}>
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.pageTitle}>تعديل جهة الطوارئ</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>الاسم</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="اسم الشخص"
              placeholderTextColor={Colors.outline}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
            <MaterialIcons name="person" size={20} color={Colors.outline} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="+966501234567"
              placeholderTextColor={Colors.outline}
              value={phone}
              onChangeText={(t) => { setPhone(t); if (phoneError) setPhoneError(""); }}
              keyboardType="phone-pad"
              textAlign="right"
            />
            <MaterialIcons name="call" size={20} color={Colors.outline} />
          </View>
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.importBtn}
          onPress={handleImportContacts}
          disabled={loadingContacts}
          activeOpacity={0.8}
        >
          {loadingContacts ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <>
              <MaterialIcons name="contacts" size={20} color={Colors.primary} />
              <Text style={styles.importBtnText}>اختيار من جهات الاتصال</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          style={styles.saveBtnGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={showContacts} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.modalTitle}>جهات الاتصال</Text>
            <TouchableOpacity onPress={() => setShowContacts(false)}>
              <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={contactsList}
            keyExtractor={(item) => item.id ?? Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => handleSelectContact(item)}
                activeOpacity={0.7}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>{item.name?.charAt(0) ?? "?"}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  {item.phoneNumbers?.[0]?.number ? (
                    <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "center",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLow,
  },
  form: {
    flex: 1,
    gap: 20,
    paddingTop: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Tajawal_400Regular",
    paddingVertical: 14,
    color: Colors.onSurface,
    textAlign: "right",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: Colors.error,
    textAlign: "right",
    marginTop: 4,
  },
  importBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primaryFixedDim,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 10,
    backgroundColor: Colors.primaryFixedDim + "33",
  },
  importBtnText: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnGrad: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceContainerHighest,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceContainerHighest,
    gap: 14,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurface,
    textAlign: "right",
  },
  contactPhone: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
  },
});
