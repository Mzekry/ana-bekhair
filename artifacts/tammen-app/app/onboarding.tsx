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
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
const COUNTRY_CODES = ["+966", "+971", "+965", "+974", "+968", "+20", "+962", "+963", "+964", "+1"];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setContact } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [phoneError, setPhoneError] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);
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
    if (cleanPhone.startsWith("+")) {
      const found = COUNTRY_CODES.find((code) => cleanPhone.startsWith(code));
      if (found) {
        setCountryCode(found);
        setPhone(cleanPhone.slice(found.length));
      } else {
        setPhone(cleanPhone);
      }
    } else {
      setPhone(cleanPhone);
    }
    setPhoneError("");
    setShowContacts(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال الاسم");
      return;
    }
    const fullPhone = `${countryCode}${phone.trim()}`;
    if (!PHONE_REGEX.test(fullPhone)) {
      setPhoneError("رقم الهاتف غير صحيح");
      return;
    }
    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const w: WatcherContact = { name: name.trim(), phone: fullPhone };
      await setContact(w);
      router.replace("/(tabs)");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad }]}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>إضافة شخص الطوارئ</Text>
          <Text style={styles.subtitle}>
            أضف جهة اتصال الطوارئ لضمان بقائك في أمان تام دائماً.
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImportContacts}
            disabled={loadingContacts}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.secondary, "#004a8c"]}
              style={styles.importBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loadingContacts ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="contacts" size={26} color="#fff" />
                  <Text style={styles.importBtnText}>اختر من جهات الاتصال</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو أدخل يدوياً</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>اسم شخص الطوارئ</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل الاسم الكامل"
                  placeholderTextColor={Colors.outline}
                  value={name}
                  onChangeText={setName}
                  textAlign="right"
                />
                <MaterialIcons name="person" size={20} color={Colors.outline} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>رقم الجوال</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phoneInputWrap}>
                  <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="500000000"
                      placeholderTextColor={Colors.outline}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t);
                        setPhoneError("");
                      }}
                      keyboardType="phone-pad"
                      textAlign="left"
                    />
                    <MaterialIcons name="call" size={20} color={Colors.outline} />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.codeBtn}
                  onPress={() => setShowCodePicker(true)}
                >
                  <Text style={styles.codeBtnText}>{countryCode}</Text>
                  <MaterialIcons name="arrow-drop-down" size={18} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
              <Text style={styles.phoneHint}>
                الرمز الدولي: {countryCode}
              </Text>
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
                  <>
                    <Text style={styles.saveBtnText}>حفظ شخص الطوارئ</Text>
                    <MaterialIcons name="favorite" size={22} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>
              سيتم إرسال تنبيه فوري لهذا الشخص في حال عدم استجابتك لطلبات التحقق من السلامة.
            </Text>
          </View>
        </ScrollView>

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
              keyExtractor={(_item, index) => String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleSelectContact(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>{item.name?.charAt(0) ?? "?"}</Text>
                  </View>
                  <View style={styles.contactInfoWrap}>
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

        <Modal visible={showCodePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.modalTitle}>اختر الرمز الدولي</Text>
              <TouchableOpacity onPress={() => setShowCodePicker(false)}>
                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.contactRow,
                    item === countryCode && { backgroundColor: Colors.primaryFixedDim + "33" },
                  ]}
                  onPress={() => {
                    setCountryCode(item);
                    setShowCodePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactName}>{item}</Text>
                  {item === countryCode && (
                    <MaterialIcons name="check" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    gap: 20,
  },
  titleSection: { gap: 8 },
  title: {
    fontSize: 30,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.onSurface,
    textAlign: "right",
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    lineHeight: 22,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 8,
  },
  importBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
  },
  importBtnGrad: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 12,
  },
  importBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    color: Colors.outline,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 20,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: { gap: 6 },
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
    paddingVertical: 12,
    color: Colors.onSurface,
  },
  phoneRow: {
    flexDirection: "row-reverse",
    gap: 10,
    alignItems: "stretch",
  },
  phoneInputWrap: { flex: 1 },
  codeBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 2,
    minWidth: 80,
  },
  codeBtnText: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
  },
  phoneHint: {
    fontSize: 12,
    fontFamily: "Tajawal_400Regular",
    color: Colors.outline,
    textAlign: "right",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: Colors.error,
    textAlign: "right",
  },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  saveBtnGrad: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
  },
  infoBanner: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    backgroundColor: Colors.tertiaryFixed + "66",
    borderRadius: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    lineHeight: 20,
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
  contactInfoWrap: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  contactName: {
    flex: 1,
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
