import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WishlistItem, getRemainingDays } from '../wishlistUtils';
import { PaletteColors, Language } from '../../calculator/constants';

type Props = {
  item: WishlistItem;
  colors: PaletteColors;
  language: Language;
  currencySymbol: string;
  requiredHours: number | null;
  onPurchase: () => void;
  onDelete: () => void;
  onDetail: () => void;
};

export default function WishlistItemCard({
  item,
  colors,
  language,
  currencySymbol,
  requiredHours,
  onPurchase,
  onDelete,
  onDetail,
}: Props) {
  const ko = language === 'ko';
  const remaining = getRemainingDays(item);
  const purchased = item.status === 'purchased';

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            {currencySymbol}{Number(item.price).toLocaleString()}
          </Text>
        </View>

        <View style={[
          styles.status,
          { backgroundColor: purchased ? '#DCFCE7' : colors.button },
        ]}>
          <Text style={{
            color: purchased ? '#166534' : colors.buttonText,
            fontSize: 11,
            fontWeight: '700',
          }}>
            {purchased
              ? (ko ? '구매 완료' : 'Purchased')
              : remaining > 0
                ? (ko ? `D-${remaining}` : `${remaining} days left`)
                : (ko ? '구매 결정 가능' : 'Ready to decide')}
          </Text>
        </View>
      </View>

      <View style={[styles.info, { borderTopColor: colors.border }]}>
        <Text style={[styles.muted, { color: colors.muted }]}>
          {ko ? '필요한 노동시간' : 'Work time needed'}
        </Text>
        <Text style={[styles.hours, { color: colors.logo }]}>
          {requiredHours === null
            ? '--'
            : `${requiredHours.toFixed(1)} ${ko ? '시간' : 'hrs'}`}
        </Text>
      </View>

      {!purchased ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onPurchase}
            style={[styles.actionButton, { backgroundColor: colors.button }]}
          >
            <Text style={[styles.actionText, { color: colors.buttonText }]}>
              {ko ? '구매 완료' : 'Mark purchased'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={[styles.actionButton, { backgroundColor: colors.input }]}
          >
            <Text style={[styles.actionText, { color: colors.muted }]}>
              {ko ? '삭제' : 'Delete'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={onDetail}
            style={[styles.actionButton, { backgroundColor: colors.button }]}
          >
            <Text style={[styles.actionText, { color: colors.buttonText }]}>
              {ko ? '상세 기록' : 'Details'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={[styles.actionButton, { backgroundColor: colors.input }]}
          >
            <Text style={[styles.actionText, { color: colors.muted }]}>
              {ko ? '기록 삭제' : 'Delete record'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleWrap: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800' },
  price: { fontSize: 14, marginTop: 6, fontWeight: '600' },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  info: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muted: { fontSize: 12 },
  hours: { fontSize: 17, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 11,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});
