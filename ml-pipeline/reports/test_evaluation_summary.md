# KanjiCNN Evaluation Report: Held-Out Test Set

- **Evaluated Checkpoint:** `best_kanji_cnn.pth` (Epoch 10)
- **Test Set Size:** 3,402 images (21 samples/class across 162 classes)
- **Classes:** 162 (71 Hiragana + 91 JLPT N5 Kanji)

## Overall Metrics

| Metric | Value |
| :--- | :--- |
| **Test Top-1 Accuracy** | **98.74%** (3359/3402) |
| **Test Top-5 Accuracy** | **99.88%** (3398/3402) |
| **Test Cross-Entropy Loss** | **0.0494** |
| **Perfect Accuracy Classes (100%)** | **126 / 162** (77.8%) |

## Most Frequently Confused Character Pairs

| True Character | Misclassified As | Misclassification Count |
| :---: | :---: | :---: |
| 八 | 入 | 3 |
| お | 母 | 1 |
| き | ま | 1 |
| ぎ | き | 1 |
| さ | き | 1 |
| せ | 北 | 1 |
| ぞ | 出 | 1 |
| ぞ | そ | 1 |
| ど | と | 1 |
| な | す | 1 |
| な | 休 | 1 |
| に | 小 | 1 |

## Characters with Lowest Accuracy

| Character | Category | Accuracy | Correct / Total |
| :---: | :---: | :---: | :---: |
| 八 | N5 Kanji | 85.7% | 18 / 21 |
| ぞ | Hiragana | 90.5% | 19 / 21 |
| な | Hiragana | 90.5% | 19 / 21 |
| ぱ | Hiragana | 90.5% | 19 / 21 |
| や | Hiragana | 90.5% | 19 / 21 |
| 万 | N5 Kanji | 90.5% | 19 / 21 |
| お | Hiragana | 95.2% | 20 / 21 |
| き | Hiragana | 95.2% | 20 / 21 |
| ぎ | Hiragana | 95.2% | 20 / 21 |
| さ | Hiragana | 95.2% | 20 / 21 |
