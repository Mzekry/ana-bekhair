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
const COUNTRY_CODES = ["+966", "+971", "+965", "+974", "+968", "+20", "+962", "+963", "+964"];

export default function ContactsTab() {
  const insets = useSafeAreaInsets();
  const { contact, setContact } = useApp();

  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(
    contact?.phone
      ? contact.phone.replace(/^\+[0-9]{2,4}/, "")
      : ""
  );
  const [countryCode, setCountryCode] = useState("+966");
  const [phoneError, setPhoneError] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = (Platform.OS === "web" ? 84 : 72) + Math.max(insets.bottom, 0) + 16;

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
      router.push("/(tabs)");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-forward" size={24} color={Colors.primaryContainer} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>أنا بخير</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>إضافة شخص الطوارئ</Text>
          <Text style={styles.subtitle}>
            أضف جهة اتصال الطوارئ الرئيسية الخاصة بك لضمان بقائك في أمان تام دائماً.
          </Text>
        </View>

        <View style={styles.choiceGrid}>
          <TouchableOpacity style={[styles.choiceCard, { backgroundColor: Colors.surfaceContainerLowest }]} activeOpacity={0.8}>
            <View style={[styles.choiceIcon, { backgroundColor: Colors.primaryFixedDim }]}>
              <MaterialIcons name="person-add" size={24} color={Colors.primaryContainer} />
            </View>
            <Text style={styles.choiceLabel}>إضافة يدوياً</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceCard, { backgroundColor: Colors.surfaceContainerLow }]}
            onPress={handleImportContacts}
            disabled={loadingContacts}
            activeOpacity={0.8}
          >
            {loadingContacts ? (
              <ActivityIndicator color={Colors.secondary} />
            ) : (
              <>
                <View style={[styles.choiceIcon, { backgroundColor: Colors.secondaryFixedDim }]}>
                  <MaterialIcons name="contacts" size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.choiceLabel}>اختر من جهات الاتصال</Text>
              </>
            )}
          </TouchableOpacity>
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

          <View style={styles.phoneRow}>
            <View style={styles.phoneInputWrap}>
              <Text style={styles.label}>رقم الجوال</Text>
              <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input]}
                  placeholder="50 000 0000"
                  placeholderTextColor={Colors.outline}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setPhoneError(""); }}
                  keyboardType="phone-pad"
                  textAlign="left"
                />
                <MaterialIcons name="call" size={20} color={Colors.outline} />
              </View>
            </View>
            <View style={styles.codeWrap}>
              <Text style={styles.label}>الرمز</Text>
              <View style={[styles.inputWrapper]}>
                <Text style={styles.codeText}>{countryCode}</Text>
              </View>
            </View>
          </View>

          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}

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
          <MaterialIcons name="info" size={20} color={Colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            سيتم إرسال تنبيه فوري لهذا الشخص في حال عدم استجابتك لطلبات التحقق من السلامة أو في حالات الطوارئ.
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
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.primaryContainer,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  titleSection: {
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontFamily: "Tajawal_800ExtraBold",
    color: Colors.onSurface,
    textAlign: "right",
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Tajawal_400Regular",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    lineHeight: 24,
  },
  choiceGrid: {
    flexDirection: "row-reverse",
    gap: 14,
  },
  choiceCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "flex-end",
    gap: 16,
    minHeight: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: "space-between",
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceLabel: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurface,
    textAlign: "right",
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
    marginBottom: 4,
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
    gap: 12,
  },
  phoneInputWrap: {
    flex: 1,
  },
  codeWrap: {
    width: 80,
  },
  codeText: {
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
    color: Colors.onSurface,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
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
    padding: 16,
    backgroundColor: Colors.tertiaryFixed + "66",
    borderRadius: 16,
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
