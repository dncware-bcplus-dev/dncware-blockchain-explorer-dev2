# DNCWARE Blockchain+ Explorer

DNCWARE Blockchain+ 向けの**静的Webページ**ベースのブロックチェーンエクスプローラーです。ブロックチェーンネットワーク上のトランザクション、ブロック、ユーザー、コントラクト、グループなどの情報を閲覧できます。

このアプリケーションは静的HTMLファイルとして動作し、Webサーバーにデプロイするだけで利用できます。

## Trademarks

- 「DNCWARE」、「DNCWARE Blockchain+」は、東芝デジタルソリューションズ株式会社の日本またはその他の国における登録商標または商標です。
- その他、本書に記載されている社名および商品名はそれぞれ各社が商標または登録商標として使用している場合があります。

## 🌟 主な機能

- **ダッシュボード**: 最近のユーザー、コントラクト、トランザクションを表示
- **検索機能**: ユーザーID、トランザクション、ブロックの検索
- **ブロック閲覧**: ブロック詳細とナビゲーション
- **トランザクション管理**: トランザクション詳細とプルーフ生成
- **ユーザー管理**: ユーザー詳細とACLグループ情報
- **コントラクト表示**: スマートコントラクトの詳細と実行
- **グループ管理**: アクセス制御グループの管理
- **ピア情報**: ネットワークピアの状態表示

## 🚀 デプロイ

### 前提条件

- DNCWARE Blockchain+ ネットワークへの接続
- 静的ファイルを配信できるWebサーバー

### デプロイ手順

1. **ファイルの配置**
   
   `src/` ディレクトリ内のすべてのファイルをWebサーバーのドキュメントルートにコピーします。

2. **設定の更新**
   
   `config.js` ファイルでブロックチェーンネットワークの接続先を設定します：
   
   ```javascript
   var cfg_chainID = "your-blockchain-network.com";
   var cfg_serverURLs = [
       "https://node1.your-blockchain-network.com",
       "https://node2.your-blockchain-network.com",
       "https://node3.your-blockchain-network.com",
   ];
   ```

3. **アクセス**
   
   ブラウザで `index.html` にアクセスしてアプリケーションを使用します。

## 🛠️ 開発・テスト環境

このセクションは開発者向けの情報です。実際のデプロイには不要です。

### テスト環境のセットアップ

1. **依存関係のインストール（テスト用）**
   ```bash
   npm install
   ```

2. **Playwrightブラウザのインストール（E2Eテスト用）**
   ```bash 
   npx playwright install
   ```

## ⚙️ 設定

### ブロックチェーン接続設定

`src/config.js` ファイルでブロックチェーンネットワークの接続先を設定します：

```javascript
var cfg_chainID = "trial.dncware-blockchain.biz";
var cfg_serverURLs = [
    "https://trial1.dncware-blockchain.biz",
    "https://trial2.dncware-blockchain.biz",
    "https://trial3.dncware-blockchain.biz",
];
```

## 🌐 ローカル開発・テストサーバー

**注意**: 以下は開発・テスト用の情報です。本番環境では通常のWebサーバーに静的ファイルをデプロイしてください。

### テスト用サーバー起動

```bash
# テスト用開発サーバーを起動（ポート8003）
npm start

# または直接実行
node server.js
```

### アクセス

- **URL**: http://localhost:8003/index.html
- **ポート**: 8003

## 🧪 開発・テスト環境

### テスト用ツールのインストール

**注意**: 以下は開発・テスト環境の構築用です。本番デプロイには不要です。

```bash
# テスト・開発用依存関係のインストール
npm install
```

### Jestテスト（ユニット・統合テスト）

```bash
# 全テスト実行
npm test

# 監視モード
npm run test:watch

# カバレッジ付き実行
npm run test:coverage

# 特定のテストファイル実行
npm run test:util        # util.js のテスト
npm run test:listview    # listview.js のテスト
```

### Playwrightテスト（E2Eテスト）

```bash
# E2Eテストを実行
npx playwright test

# 特定のブラウザでテスト
npx playwright test --project=chromium

# UIモードでテスト実行
npx playwright test --ui

# デバッグモード
npx playwright test --debug
```

## 📁 プロジェクト構造

```
├── src/                          # アプリケーションソースコード
│   ├── index.html               # メインHTMLファイル
│   ├── config.js                # ブロックチェーン接続設定
│   ├── navbar.js                # ナビゲーションバー機能
│   ├── dashboard.js             # ダッシュボード機能
│   ├── listview.js              # リスト表示機能
│   ├── dialogs.js               # ダイアログ・モーダル機能
│   ├── proof.js                 # ブロックチェーンプルーフ機能
│   ├── util.js                  # ユーティリティ関数
│   ├── custom.css               # カスタムスタイル
│   ├── dncware-blockchain-browser-api.mjs  # ブロックチェーンAPI
│   └── brand.gif                # ブランドロゴ
├── tests/                        # テストファイル
│   ├── *.test.js                # Jestユニット・統合テスト
│   ├── e2e/                     # Playwright E2Eテスト
│   ├── helpers/                 # テストヘルパー
│   └── lib/                     # テスト用ライブラリ
├── server.js                     # 開発用静的ファイルサーバー
├── jest.config.js               # Jest設定
├── playwright.config.js         # Playwright設定
└── package.json                 # NPM設定
```

## 🔧 開発

### コード品質

- **テストカバレッジ**: 全主要機能のユニットテスト・統合テスト
- **E2Eテスト**: 実際のユーザーフローをテスト
- **ESLint**: コード品質チェック（設定済み）
- **copyright表記**: 全ソースファイルに統一されたcopyright表記

### テスト戦略

1. **ユニットテスト**: 個別関数の動作検証
2. **統合テスト**: モジュール間の連携検証
3. **E2Eテスト**: ブラウザでの実際の動作検証

## 🔧 トラブルシューティング

### よくある問題

1. **ブロックチェーンに接続できない**
   - `src/config.js` の設定を確認
   - ネットワーク接続を確認
   - ブロックチェーンノードが稼働中か確認

2. **ポート8003が使用中**
   - `server.js` の `PORT` 変数を変更
   - `playwright.config.js` の `baseURL` も更新

3. **テストが失敗する**
   - 開発サーバーが起動していることを確認
   - ブロックチェーンネットワークにアクセス可能か確認

4. **パフォーマンスが遅い**
   - ブロックチェーンノードとの接続速度を確認
   - ブラウザのキャッシュをクリア

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。
