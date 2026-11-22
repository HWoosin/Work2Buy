import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { CURRENCIES, CurrencyCode } from "../../constants/currencies";
import { Language, PaletteColors } from "../calculator/constants";
import WishlistItemCard from "./components/WishlistItemCard";
import { WishlistItem, getRequiredHours } from "./wishlistUtils";
import {
  addWishlistItem,
  deleteWishlistItem,
  getWishlistItems,
  updateWishlistStatus,
} from "../../database/wishlistDatabase.js";

type Props = {
  onBack: () => void;
  onEditWorkConditions: () => void;
  colors: PaletteColors;
  language: Language;
  currency: CurrencyCode;
  monthlySalary: number;
  dailyHours: number;
  monthlyDays: number;
};

const HOLD_OPTIONS = [1, 7, 30];

export default function WishlistScreen({
  onBack,
  onEditWorkConditions,
  colors,
  language,
  currency,
  monthlySalary,
  dailyHours,
  monthlyDays,
}: Props) {
  const ko = language === "ko";
  const symbol = CURRENCIES[currency].symbol;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [holdDays, setHoldDays] = useState(7);
  const [filter, setFilter] = useState<"pending" | "purchased">("pending");
  const [error, setError] = useState("");

  const hasWorkConditions =
    monthlySalary > 0 && dailyHours > 0 && monthlyDays > 0;

  const loadItems = useCallback(async () => {
    try {
      const rows = await getWishlistItems();
      setItems(rows as WishlistItem[]);
    } catch (e) {
      console.error("구매 고민 목록 조회 실패:", e);
      Alert.alert(
        ko ? "오류" : "Error",
        ko ? "목록을 불러오지 못했습니다." : "Could not load your list.",
      );
    }
  }, [ko]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.status === filter),
    [items, filter],
  );
  const pendingCount = items.filter((item) => item.status === "pending").length;

  const handleAdd = async () => {
    const numericPrice = Number(price.replace(/,/g, ""));
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError(
        ko
          ? "물건 이름과 올바른 가격을 입력해 주세요."
          : "Enter an item name and a valid price.",
      );
      return;
    }
    try {
      await addWishlistItem(name.trim(), numericPrice, holdDays);
      setName("");
      setPrice("");
      setHoldDays(7);
      setError("");
      setModalVisible(false);
      await loadItems();
    } catch (e) {
      console.error("구매 고민 저장 실패:", e);
      setError(
        ko
          ? "저장하지 못했습니다. 다시 시도해 주세요."
          : "Could not save. Please try again.",
      );
    }
  };

  const markPurchased = (item: WishlistItem) => {
    Alert.alert(
      ko ? "구매 완료" : "Mark as purchased",
      ko
        ? `${item.name} 구매를 완료하셨나요?`
        : `Have you purchased ${item.name}?`,
      [
        { text: ko ? "취소" : "Cancel", style: "cancel" },
        {
          text: ko ? "완료" : "Confirm",
          onPress: async () => {
            await updateWishlistStatus(item.id, "purchased");
            await loadItems();
          },
        },
      ],
    );
  };

  const removeItem = (item: WishlistItem) => {
    Alert.alert(
      ko ? "삭제" : "Delete",
      ko ? `${item.name} 기록을 삭제할까요?` : `Delete ${item.name}?`,
      [
        { text: ko ? "취소" : "Cancel", style: "cancel" },
        {
          text: ko ? "삭제" : "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteWishlistItem(item.id);
            await loadItems();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={onBack}
              style={[styles.back, { backgroundColor: colors.card }]}
            >
              <Text style={{ color: colors.text, fontSize: 20 }}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {ko ? "구매 고민 보관함" : "Purchase Wishlist"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {ko
                  ? "잠시 기다리고, 다시 생각해 보세요."
                  : "Pause before you purchase."}
              </Text>
            </View>
          </View>

          <View style={[styles.summary, { backgroundColor: colors.result }]}>
            <Text style={styles.summaryLabel}>
              {ko ? "구매를 고민 중인 물건" : "Items on hold"}
            </Text>
            <Text style={styles.summaryNumber}>
              {pendingCount}
              <Text style={styles.summaryUnit}>{ko ? "개" : " items"}</Text>
            </Text>
            <Text style={styles.summaryHint}>
              {ko
                ? "보류 기간이 지나면 구매 여부를 결정할 수 있습니다."
                : "You can decide once the waiting period ends."}
            </Text>
          </View>
          {!hasWorkConditions && (
            <Pressable
              onPress={onEditWorkConditions}
              style={{
                backgroundColor: colors.card,
                padding: 16,
                borderRadius: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {ko
                  ? "근무조건이 설정되지 않았습니다."
                  : "Work details are not set."}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 6 }}>
                {ko
                  ? "여기를 눌러 근무조건을 설정하고 필요한 노동시간을 계산하세요."
                  : "Tap here to set work details and calculate work hours."}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              setError("");
              setModalVisible(true);
            }}
            style={[styles.addButton, { backgroundColor: colors.button }]}
          >
            <Text style={[styles.addButtonText, { color: colors.buttonText }]}>
              ＋ {ko ? "구매 고민 추가하기" : "Add an item"}
            </Text>
          </Pressable>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setFilter("pending")}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    filter === "pending" ? colors.button : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    filter === "pending" ? colors.buttonText : colors.muted,
                  fontWeight: "700",
                }}
              >
                {ko ? "고민 중" : "On hold"} ({pendingCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter("purchased")}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    filter === "purchased" ? colors.button : colors.card,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    filter === "purchased" ? colors.buttonText : colors.muted,
                  fontWeight: "700",
                }}
              >
                {ko ? "구매 완료" : "Purchased"} ({items.length - pendingCount})
              </Text>
            </Pressable>
          </View>

          {visibleItems.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card }]}>
              <Text style={{ fontSize: 30, marginBottom: 8 }}>
                {filter === "pending" ? "🛍️" : "✓"}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === "pending"
                  ? ko
                    ? "아직 고민 중인 물건이 없습니다."
                    : "Nothing on hold yet."
                  : ko
                    ? "구매 완료한 물건이 없습니다."
                    : "No purchases recorded."}
              </Text>
              <Text style={[styles.emptyHint, { color: colors.muted }]}>
                {filter === "pending"
                  ? ko
                    ? "사고 싶은 물건을 등록해 보세요."
                    : "Add something you are considering."
                  : ko
                    ? "구매 완료한 항목이 여기에 표시됩니다."
                    : "Completed purchases will appear here."}
              </Text>
            </View>
          ) : (
            visibleItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                colors={colors}
                language={language}
                currencySymbol={symbol}
                requiredHours={
                  hasWorkConditions
                    ? getRequiredHours(
                        Number(item.price),
                        monthlySalary,
                        dailyHours,
                        monthlyDays,
                      )
                    : null
                }
                onPurchase={() => markPurchased(item)}
                onDelete={() => removeItem(item)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ width: "100%" }}
              >
                <View style={[styles.modal, { backgroundColor: colors.card }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {ko ? "구매 고민 등록" : "Add to wishlist"}
                  </Text>

                  <Text style={[styles.label, { color: colors.muted }]}>
                    {ko ? "물건 이름" : "Item name"}
                  </Text>

                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={
                      ko ? "예: 새 운동화" : "e.g. New running shoes"
                    }
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.input,
                      { backgroundColor: colors.input, color: colors.text },
                    ]}
                    editable={true}
                    showSoftInputOnFocus={true}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      // 다음 가격 입력창으로 이동
                    }}
                  />

                  <Text style={[styles.label, { color: colors.muted }]}>
                    {ko ? "구매 가격" : "Price"}
                  </Text>

                  <View
                    style={[
                      styles.priceInput,
                      { backgroundColor: colors.input },
                    ]}
                  >
                    <Text style={{ color: colors.muted }}>{symbol}</Text>

                    <TextInput
                      value={price ? Number(price).toLocaleString("en-US") : ""}
                      onChangeText={(value) => {
                        setPrice(value.replace(/[^0-9]/g, ""));
                        setError("");
                      }}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      style={[styles.priceText, { color: colors.text }]}
                    />
                  </View>

                  <Text style={[styles.label, { color: colors.muted }]}>
                    {ko ? "구매 보류 기간" : "Waiting period"}
                  </Text>

                  <View style={styles.holdRow}>
                    {HOLD_OPTIONS.map((days) => (
                      <Pressable
                        key={days}
                        onPress={() => setHoldDays(days)}
                        style={[
                          styles.holdOption,
                          {
                            backgroundColor:
                              holdDays === days ? colors.button : colors.input,
                            borderColor:
                              holdDays === days
                                ? colors.buttonText
                                : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              holdDays === days
                                ? colors.buttonText
                                : colors.muted,
                            fontWeight: "700",
                          }}
                        >
                          {days}
                          {ko ? "일" : " days"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {!!error && <Text style={styles.error}>{error}</Text>}

                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => {
                        Keyboard.dismiss();
                        setModalVisible(false);
                      }}
                      style={[
                        styles.modalButton,
                        { backgroundColor: colors.input },
                      ]}
                    >
                      <Text style={{ color: colors.muted, fontWeight: "700" }}>
                        {ko ? "취소" : "Cancel"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleAdd}
                      style={[
                        styles.modalButton,
                        { backgroundColor: colors.button },
                      ]}
                    >
                      <Text
                        style={{ color: colors.buttonText, fontWeight: "800" }}
                      >
                        {ko ? "저장하기" : "Save"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 14,
    marginBottom: 22,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 4 },
  summary: { borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryLabel: { color: "#CBD5E1", fontSize: 12 },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
  },
  summaryUnit: { fontSize: 16, fontWeight: "600" },
  summaryHint: { color: "#CBD5E1", fontSize: 11, marginTop: 8 },
  addButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: { fontSize: 14, fontWeight: "800" },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  empty: { borderRadius: 18, padding: 28, alignItems: "center", marginTop: 4 },
  emptyTitle: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  emptyHint: { fontSize: 11, marginTop: 7, textAlign: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  priceInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: { flex: 1, paddingVertical: 13, paddingLeft: 8, fontSize: 15 },
  holdRow: { flexDirection: "row", gap: 8 },
  holdOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    paddingVertical: 12,
  },
  error: { color: "#DC2626", fontSize: 12, marginTop: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
});
