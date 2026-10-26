(function (root) {
  'use strict';

  const CATEGORIES = [
    { id: 'print', label: '📄 用紙・印刷・手帳シール', badgeColor: 'blue' },
    { id: 'bag', label: '🛍️ 薬袋・ジップロック・袋類', badgeColor: 'teal' },
    { id: 'dispense', label: '💊 一包化の袋・調剤容器', badgeColor: 'amber' }
  ];

  const DEFAULT_MATERIALS = [
    {
      id: 'color_yakujo',
      categoryId: 'print',
      name: 'カラーの薬説明書（薬情・カラー印刷）',
      unit: '枚',
      unitPrice: 8.5,
      step: 0.5,
      hint: 'A4用紙＋カラートナー/インク代'
    },
    {
      id: 'mono_yakujo',
      categoryId: 'print',
      name: '白黒の薬説明書（薬情・モノクロ印刷）',
      unit: '枚',
      unitPrice: 2.0,
      step: 0.5,
      hint: 'A4用紙＋モノクロトナー代'
    },
    {
      id: 'receipt_sheet',
      categoryId: 'print',
      name: '領収書・調剤明細書（用紙出力）',
      unit: '枚',
      unitPrice: 2.0,
      step: 0.5,
      hint: '用紙＋モノクロ印刷代'
    },
    {
      id: 'techo_seal',
      categoryId: 'print',
      name: 'おくすり手帳のシール',
      unit: '枚',
      unitPrice: 2.5,
      step: 0.5,
      hint: '専用ラベル紙＋サーマル/トナー印字代'
    },
    {
      id: 'techo_book',
      categoryId: 'print',
      name: 'おくすり手帳（冊子本体の進呈）',
      unit: '冊',
      unitPrice: 35.0,
      step: 1,
      hint: '新規・満了時の手帳冊子原価'
    },
    {
      id: 'yakutai_regular',
      categoryId: 'bag',
      name: '薬袋（標準サイズ）',
      unit: '枚',
      unitPrice: 3.5,
      step: 0.5,
      hint: '内服・外用・頓服用の通常薬袋＋印字'
    },
    {
      id: 'yakutai_large',
      categoryId: 'bag',
      name: '大型薬袋（一包化・長期・多剤用）',
      unit: '枚',
      unitPrice: 7.5,
      step: 0.5,
      hint: 'A4大サイズ・マチ付き等の大型薬袋'
    },
    {
      id: 'ziplock_bag',
      categoryId: 'bag',
      name: 'ジップロック（チャック付きポリ袋）',
      unit: '袋',
      unitPrice: 4.5,
      step: 0.5,
      hint: '一包化の防湿や外用・残薬整理用のチャック袋'
    },
    {
      id: 'mini_shield_bag',
      categoryId: 'bag',
      name: '点眼袋・遮光袋・小分けポリ袋',
      unit: '枚',
      unitPrice: 2.0,
      step: 0.5,
      hint: '目薬袋・遮光チャック袋・レジ袋等'
    },
    {
      id: 'cool_bag',
      categoryId: 'bag',
      name: '保冷バッグ・保冷剤セット',
      unit: '組',
      unitPrice: 25.0,
      step: 1,
      hint: 'インスリン・冷所目薬・坐剤等の保冷資材'
    },
    {
      id: 'ippoka_pack',
      categoryId: 'dispense',
      name: '一包化の袋（分包紙＋インクリボン）',
      unit: '包',
      unitPrice: 1.8,
      step: 0.1,
      hint: '1包あたりの分包紙＋印字リボン代（空包含む）'
    },
    {
      id: 'ointment_jar',
      categoryId: 'dispense',
      name: '軟膏容器（軟膏ツボ）',
      unit: '個',
      unitPrice: 16.0,
      step: 1,
      hint: '混合軟膏・小分け用の軟膏容器代'
    },
    {
      id: 'syrup_bottle',
      categoryId: 'dispense',
      name: '水剤ボトル・計量カップ',
      unit: '本',
      unitPrice: 28.0,
      step: 1,
      hint: '小児シロップ等の水剤投薬瓶代'
    }
  ];

  const DEFAULT_PATTERNS = [
    {
      id: 'standard',
      name: '通常外来処方',
      icon: '🏥',
      description: '一般的な内服・外用処方（シート調剤メイン）',
      ratio: 65,
      techFee: 1850,
      items: {
        color_yakujo: { checked: true, qty: 1 },
        mono_yakujo: { checked: false, qty: 1 },
        receipt_sheet: { checked: true, qty: 1 },
        techo_seal: { checked: true, qty: 1 },
        techo_book: { checked: false, qty: 1 },
        yakutai_regular: { checked: true, qty: 2 },
        yakutai_large: { checked: false, qty: 1 },
        ziplock_bag: { checked: true, qty: 1 },
        mini_shield_bag: { checked: false, qty: 1 },
        cool_bag: { checked: false, qty: 1 },
        ippoka_pack: { checked: false, qty: 28 },
        ointment_jar: { checked: false, qty: 1 },
        syrup_bottle: { checked: false, qty: 1 }
      }
    },
    {
      id: 'ippoka',
      name: '一包化・多剤処方',
      icon: '📦',
      description: '分包紙・大型薬袋・チャック袋を多用する処方',
      ratio: 25,
      techFee: 3100,
      items: {
        color_yakujo: { checked: true, qty: 2 },
        mono_yakujo: { checked: false, qty: 2 },
        receipt_sheet: { checked: true, qty: 1 },
        techo_seal: { checked: true, qty: 2 },
        techo_book: { checked: false, qty: 1 },
        yakutai_regular: { checked: false, qty: 1 },
        yakutai_large: { checked: true, qty: 1 },
        ziplock_bag: { checked: true, qty: 2 },
        mini_shield_bag: { checked: false, qty: 1 },
        cool_bag: { checked: false, qty: 1 },
        ippoka_pack: { checked: true, qty: 45 },
        ointment_jar: { checked: false, qty: 1 },
        syrup_bottle: { checked: false, qty: 1 }
      }
    },
    {
      id: 'special',
      name: '小児・外用・混合処方',
      icon: '👶',
      description: '軟膏ツボ・水剤瓶・小分け袋など資材が多い処方',
      ratio: 10,
      techFee: 2150,
      items: {
        color_yakujo: { checked: true, qty: 1 },
        mono_yakujo: { checked: false, qty: 1 },
        receipt_sheet: { checked: true, qty: 1 },
        techo_seal: { checked: true, qty: 1 },
        techo_book: { checked: false, qty: 1 },
        yakutai_regular: { checked: true, qty: 2 },
        yakutai_large: { checked: false, qty: 1 },
        ziplock_bag: { checked: true, qty: 1 },
        mini_shield_bag: { checked: true, qty: 1 },
        cool_bag: { checked: false, qty: 1 },
        ippoka_pack: { checked: false, qty: 14 },
        ointment_jar: { checked: true, qty: 1 },
        syrup_bottle: { checked: false, qty: 1 }
      }
    }
  ];

  const KAIZEN_IDEAS = [
    {
      id: 'color_to_mono',
      title: 'カラー薬情を白黒（または希望者のみカラー）に変更',
      detail: 'カラー薬説明書をモノクロ出力に切り替えた場合のコスト削減効果',
      tag: '印刷見直し'
    },
    {
      id: 'ziplock_half',
      title: 'ジップロック（チャック袋）の配布基準見直し（半減）',
      detail: '「毎回必ず入れる」から「希望者・必要時のみ」へ見直し使用量を50%削減',
      tag: '袋類適正化'
    },
    {
      id: 'ippoka_loss_cut',
      title: '一包化の空包・印字ミス・再分包ロスを3包削減',
      detail: '分包機の設定最適化と事前チェックで1回あたり3包分のロスをカット',
      tag: '一包化改善'
    },
    {
      id: 'yakutai_bundle',
      title: '薬袋のまとめ入れ徹底（通常薬袋を0.5枚削減）',
      detail: '用法ごとの過剰な薬袋分けを見直し、2処方に1枚分の薬袋を節約',
      tag: '薬袋節約'
    },
    {
      id: 'digital_techo',
      title: '電子お薬手帳への誘導でシール＆薬情出力を30%削減',
      detail: '電子手帳アプリ活用により手帳シールと紙の薬情出力を3割カット',
      tag: 'DX・ペーパーレス'
    }
  ];

  const ANNUAL_RX_PRESETS = [
    { label: '月1,000枚 (年1.2万枚)', value: 12000 },
    { label: '月1,500枚 (年1.8万枚)', value: 18000 },
    { label: '月2,000枚 (年2.4万枚)', value: 24000 },
    { label: '月3,000枚 (年3.6万枚)', value: 36000 },
    { label: '月4,000枚 (年4.8万枚)', value: 48000 }
  ];

  const Presets = {
    CATEGORIES,
    DEFAULT_MATERIALS,
    DEFAULT_PATTERNS,
    KAIZEN_IDEAS,
    ANNUAL_RX_PRESETS
  };

  root.PharmacyApp = root.PharmacyApp || {};
  root.PharmacyApp.Presets = Presets;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Presets;
  }
})(typeof window !== 'undefined' ? window : globalThis);
