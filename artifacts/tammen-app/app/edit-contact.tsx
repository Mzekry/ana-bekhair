import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
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
  const colors = Colors.light;

  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad =
    Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 20;

  const validatePhone = (p: string) => {
    if (!PHONE_REGEX.test(p)) {
      setPhoneError("رقم الهاتف غير صحيح");
      return false;
    }
    setPhoneError("");
    return true;
  };

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
      const filtered = data.filter(
        (c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0
      );
      setContactsList(filtered);
      setShowContacts(true);
    } catch {
      Alert.alert("خطأ", "تعذر تحميل جهات الاتصال");
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact: Contacts.Contact) => {
    const rawPhone = contact.phoneNumbers?.[0]?.number ?? "";
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
    setName(contact.name ?? "");
    setPhone(cleanPhone);
    setPhoneError("");
    setShowContacts(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال الاسم");
      return;
    }
    if (!validatePhone(phone)) return;

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 8,
          paddingBottom: botPad,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          تعديل جهة الطوارئ
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>الاسم</Text>
          <View
            style={[
              styles.inputWrapper,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="اسم الشخص"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: colors.text }]}>رقم الهاتف</Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: phoneError ? colors.danger : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="+971501234567"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (phoneError) setPhoneError("");
              }}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>
          {phoneError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {phoneError}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.outlineBtn,
            { borderColor: colors.primary, backgroundColor: colors.primaryBg },
          ]}
          onPress={handleImportContacts}
          disabled={loadingContacts}
          activeOpacity={0.8}
        >
          {loadingContacts ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <Feather name="users" size={18} color={colors.primary} />
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>
                اختيار من جهات الاتصال
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.85}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showContacts} animationType="slide" presentationStyle="pageSheet">
        <View
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: colors.border,
                paddingTop: insets.top + 16,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              جهات الاتصال
            </Text>
            <TouchableOpacity onPress={() => setShowContacts(false)}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={contactsList}
            keyExtractor={(item) =>
              item.id ?? item.name ?? Math.random().toString()
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => handleSelectContact(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.contactAvatar,
                    { backgroundColor: colors.primaryBg },
                  ]}
                >
                  <Text
                    style={[styles.contactInitial, { color: colors.primary }]}
                  >
                    {item.name?.charAt(0) ?? "?"}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.phoneNumbers?.[0]?.number ? (
                    <Text
                      style={[
                        styles.contactPhone,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.phoneNumbers[0].number}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContacts}>
                <Feather name="users" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  لا توجد جهات اتصال
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    flex: 1,
    gap: 20,
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 12,
    textAlign: "right",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 6,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 10,
  },
  outlineBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  contactInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
  emptyContacts: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
