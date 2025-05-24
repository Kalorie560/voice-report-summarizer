# 音声報告書作成システム

現場職員の状況報告を簡便化するためのWebアプリケーションです。音声を録音し、Gemini APIを使用して自動的に報告書の下書きを生成します。

## 機能

- 🎙️ **音声録音**: ブラウザから直接音声を録音
- 📊 **リアルタイム波形表示**: 録音中の音声波形を視覚的に表示
- 🤖 **AI要約**: Gemini APIを使用して音声内容を自動的に報告書形式に変換
- 📋 **構造化された報告書**: 日時、状況、緊急性、報告内容、対応事項を整理して出力
- 📱 **レスポンシブデザイン**: PC・スマートフォン両方に対応

## デモ

https://kalorie560.github.io/voice-report-summarizer/

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/Kalorie560/voice-report-summarizer.git
cd voice-report-summarizer
```

### 2. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Get API key」をクリックしてAPIキーを生成
4. 生成されたAPIキーをコピー

### 3. アプリケーションの起動

#### 方法1: ローカルサーバーを使用

Pythonがインストールされている場合:

```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

その後、ブラウザで `http://localhost:8000` にアクセス

#### 方法2: Visual Studio Codeの拡張機能を使用

1. VS Codeで「Live Server」拡張機能をインストール
2. `index.html`を右クリックし、「Open with Live Server」を選択

#### 方法3: 直接ファイルを開く

`index.html`をブラウザで直接開く（一部の機能が制限される可能性があります）

## 使い方

1. **APIキーの設定**
   - Gemini API Keyフィールドに取得したAPIキーを入力
   - APIキーは自動的にブラウザのローカルストレージに保存されます

2. **録音開始**
   - 「録音開始」ボタンをクリック
   - ブラウザからマイクへのアクセス許可を求められた場合は「許可」を選択
   - 音声波形がリアルタイムで表示されます

3. **録音停止**
   - 報告が終わったら「録音停止」ボタンをクリック
   - 自動的に音声がGemini APIに送信され、報告書が生成されます

4. **報告書の確認とコピー**
   - 生成された報告書を確認
   - 「クリップボードにコピー」ボタンで報告書全体をコピー可能

## 報告書の形式

生成される報告書には以下の項目が含まれます：

- **日時**: 報告の日時
- **状況**: 現場の状況の要約
- **緊急性**: 高・中・低の3段階評価
- **報告内容**: 詳細な報告内容
- **対応事項**: 必要な対応や推奨事項

## 技術スタック

- **フロントエンド**: Pure HTML/CSS/JavaScript
- **音声処理**: Web Audio API、MediaRecorder API
- **AI処理**: Google Gemini API (gemini-1.5-flash)
- **データ保存**: LocalStorage（APIキーの保存用）

## セキュリティに関する注意

- APIキーはブラウザのローカルストレージに保存されます
- 本番環境で使用する場合は、APIキーをサーバーサイドで管理することを推奨します
- HTTPSでホストすることで、音声録音機能が確実に動作します

## トラブルシューティング

### マイクが認識されない
- ブラウザの設定でマイクへのアクセスが許可されているか確認
- HTTPSまたはlocalhostでアクセスしているか確認

### 報告書が生成されない
- APIキーが正しく入力されているか確認
- コンソールでエラーメッセージを確認
- Gemini APIの利用制限に達していないか確認

### 音声波形が表示されない
- ブラウザがWeb Audio APIをサポートしているか確認
- 最新のChrome、Firefox、Safari、Edgeを使用することを推奨

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更を行う場合は、まずissueを作成して変更内容について議論してください。

## サポート

問題が発生した場合は、[Issues](https://github.com/Kalorie560/voice-report-summarizer/issues)でお知らせください。