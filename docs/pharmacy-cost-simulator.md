# 調剤薬局 粗利＆資材コスト気づきシミュレーター (pharmacy-cost-simulator)

## 1. 目的・コアバリュー
- **現場の自発的なコスト意識の向上**: 本部による管理ツールではなく、店舗の薬剤師・事務・店長が「うちの店舗、消耗品だけで年間こんなにかかっていたのか！」と気づき、「これを見直すだけで年間〇〇万円も利益が増えるなら頑張ろう！」と前向きに行動変容を起こすための直感型Webアプリケーション。
- **直感・簡単操作**: リアルな初期単価・処方パターンがあらかじめセットされており、チェックボックスのON/OFFやスライダー操作だけで即座に1処方あたり粗利単価と年間粗利総額が連動する。

## 2. コア計算モデル
1. **パターン別資材原価**:
   $$\text{PatternCost}_p = \sum_{i \in \text{ActiveItems}_p} (\text{UnitPrice}_i \times \text{Quantity}_{p,i})$$
2. **1処方あたり粗利単価（単一モード / 比率ミックスモード）**:
   - 単一パターンモード:
     $$\text{GrossProfitPerRx} = \text{TechFee}_p - \text{PatternCost}_p$$
   - 処方パターン比率ミックスモード（加重平均）:
     $$\text{WeightedTechFee} = \sum_{p} \left(\text{TechFee}_p \times \frac{\text{Ratio}_p}{100}\right)$$
     $$\text{WeightedMaterialCost} = \sum_{p} \left(\text{PatternCost}_p \times \frac{\text{Ratio}_p}{100}\right)$$
     $$\text{GrossProfitPerRx} = \text{WeightedTechFee} - \text{WeightedMaterialCost}$$
3. **年間シミュレーション & 気づき指標**:
   - $\text{AnnualGrossProfit} = (\text{GrossProfitPerRx} + \text{KaizenSavingsPerRx}) \times \text{AnnualRxCount}$
   - $\text{AnnualMaterialCost} = \max(0, \text{WeightedMaterialCost} - \text{KaizenSavingsPerRx}) \times \text{AnnualRxCount}$
   - **処方箋換算インパクト**: 年間資材費が「処方箋何枚分の技術料に相当するか」を算出し、現場の肌感覚に訴求する。

## 3. モジュールアーキテクチャ（SOLID / DRY / 500行未満・40行以内制約遵守）
- `js/utils/formatters.js`: 金額フォーマット、数値クランプ、DOMヘルパー等の共通関数
- `js/data/presets.js`: 処方パターン初期値、資材マスタ、改善アクション（やる気スイッチ）定義
- `js/logic/calculator.js`: 副作用のない純粋関数による原価・粗利・改善効果計算エンジン
- `js/logic/state.js`: アプリケーション状態管理、Before/After基準スナップショット、LocalStorage保存
- `js/ui/renderSummary.js`: KPIカード・Before/After比較バナー・年間インパクト描画
- `js/ui/renderPatterns.js`: 処方パターン選択・比率スライダー・技術料単価設定描画
- `js/ui/renderChecklist.js`: カテゴリ別資材チェックリスト・単価/数量調整・新規資材追加UI描画
- `js/ui/renderKaizen.js`: 「コレ変えたらいくら浮く？」改善アクションスイッチ・原価構造グラフ描画
- `js/ui/app.js`: UIイベント統合・アプリ起動処理
- `tests/calculator.test.js`: 計算エンジンの単体テスト（AAAパターン）
