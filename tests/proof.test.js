// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

const { setupDom, cleanupDom } = require('./helpers/setupDom.js');

// proof.jsの関数をインポート
const proof = require('../src/proof.js');

describe('proof.js - ブロックチェーン証明機能テスト', () => {
    beforeEach(() => {
        setupDom();
        
        // 必要最小限のグローバル設定
        global.console = { ...console, log: jest.fn(), error: jest.fn() };
        
        // 最小限のモック設定
        global.get_lastblockref = jest.fn();
        
        // proof.jsの関数をグローバルに展開
        Object.assign(global, proof);
    });

    afterEach(() => {
        cleanupDom();
        jest.clearAllMocks();
    });

    describe('Base64エンコーディング・デコーディング', () => {
        test('encodeBase64関数の基本動作', () => {
            // Arrange - 基本的なバイト配列
            const testBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
            
            // Act - Base64エンコード
            const result = proof.encodeBase64(testBytes);
            
            // Assert - 正しいBase64文字列が生成される
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/); // Base64形式
        });

        test('decodeBase64関数の基本動作', () => {
            // Arrange - 有効なBase64文字列
            const testBase64 = 'SGVsbG8='; // "Hello"のBase64
            
            // Act - Base64デコード
            const result = proof.decodeBase64(testBase64);
            
            // Assert - 正しいバイト配列が生成される
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBeGreaterThan(0);
        });

        test('Base64エンコード・デコードの往復変換', () => {
            // Arrange - テストデータ
            const originalBytes = new Uint8Array([1, 2, 3, 4, 5]);
            
            // Act - エンコード→デコード
            const encoded = proof.encodeBase64(originalBytes);
            const decoded = proof.decodeBase64(encoded);
            
            // Assert - 元のデータと一致する
            expect(decoded).toEqual(originalBytes);
        });

        test('base64関数によるUTF-8文字列のBase64変換', () => {
            // Arrange - UTF-8文字列
            const testString = 'Hello World';
            
            // Act - UTF-8 Base64変換
            const result = proof.base64(testString);
            
            // Assert - Base64文字列が生成される
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
        });

        test('空データのBase64処理', () => {
            // Arrange - 空配列
            const emptyBytes = new Uint8Array([]);
            
            // Act - 空データのエンコード
            const encoded = proof.encodeBase64(emptyBytes);
            const decoded = proof.decodeBase64(encoded);
            
            // Assert - 空データが正しく処理される
            expect(encoded).toBe('');
            expect(decoded).toEqual(emptyBytes);
        });
    });

    describe('SHA-256ハッシュ機能', () => {
        test('sha256関数の基本構造確認', () => {
            // Arrange - 関数の存在確認
            expect(typeof proof.sha256).toBe('function');
            expect(proof.sha256.constructor.name).toBe('AsyncFunction');
        });
    });

    describe('証明作成機能', () => {
        test('create_proof関数の入力検証', async () => {
            // Arrange - 最小限のテストデータ
            const validTx = { status: 'ok', blkno: 100 };
            
            // Mock最小限の依存関数
            global.get_lastblockref.mockRejectedValue(new Error('Test dependency'));
            
            // Act & Assert - 依存関数が呼ばれることを確認
            try {
                await proof.create_proof(validTx);
            } catch (e) {
                // 依存関数エラーは想定内
            }
            
            // 基本的な関数呼び出しが行われることを確認
            expect(global.get_lastblockref).toHaveBeenCalled();
        });

        test('create_proof関数のエラーハンドリング（不正なトランザクション）', async () => {
            // Arrange - 不正なステータスのトランザクション
            const invalidTx = {
                status: 'error',
                blkno: 100
            };
            
            // Act & Assert - 適切なエラーが投げられる
            await expect(proof.create_proof(invalidTx)).rejects.toBe('transaction status !== ok');
        });

        test('create_proof関数の依存関数確認', () => {
            // Arrange & Act - 関数の基本構造確認
            expect(typeof proof.create_proof).toBe('function');
            expect(proof.create_proof.constructor.name).toBe('AsyncFunction');
        });
    });

    describe('ユーティリティ関数', () => {
        test('不正なBase64文字列のデコードエラー', () => {
            // Arrange - 不正なBase64文字列
            const invalidBase64 = 'invalid@base64!';
            
            // Act & Assert - エラーが適切に投げられる
            expect(() => proof.decodeBase64(invalidBase64)).toThrow();
        });

        test('特殊文字を含む文字列のbase64変換', () => {
            // Arrange - 特殊文字を含む文字列
            const specialString = 'こんにちは世界'; // 日本語
            
            // Act - UTF-8 Base64変換
            const result = proof.base64(specialString);
            
            // Assert - 正しくエンコードされる
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('エラー処理とエッジケース', () => {
        test('長いデータのBase64処理', () => {
            // Arrange - 大きなデータ配列
            const largeData = new Uint8Array(1000).fill(65); // 'A'のASCII
            
            // Act - 大きなデータのエンコード・デコード
            const encoded = proof.encodeBase64(largeData);
            const decoded = proof.decodeBase64(encoded);
            
            // Assert - 正しく処理される
            expect(decoded.length).toBe(largeData.length);
            expect(decoded).toEqual(largeData);
        });

        test('パディング付きBase64のデコード', () => {
            // Arrange - パディング付きBase64文字列
            const paddedBase64 = 'SGVsbG8='; // パディング付き
            
            // Act - デコード
            const decoded = proof.decodeBase64(paddedBase64);
            
            // Assert - 正しくデコードされる
            expect(decoded).toBeInstanceOf(Uint8Array);
            expect(decoded.length).toBeGreaterThan(0);
        });
    });
});