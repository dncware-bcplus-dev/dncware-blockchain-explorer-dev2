// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

'use strict';

const util = require('../src/util.js');
const { setupDom, cleanupDom } = require('./helpers/setupDom.js');
const dialogs = require('../src/dialogs.js');

// Make util functions available globally for dialogs.js
Object.assign(global, util);

describe('dialogs.js - Dialog and Modal Functions', () => {
    let mockBootstrap;
    
    beforeEach(() => {
        // Setup DOM before each test
        setupDom();
        
        // グローバル変数の設定
        global.the_chainID = 'test-chain-id';
        
        // Bootstrap modal mock
        mockBootstrap = {
            Modal: jest.fn().mockImplementation((element) => ({
                show: jest.fn(),
                hide: jest.fn()
            })),
            Tooltip: jest.fn().mockImplementation(() => ({
                show: jest.fn(),
                hide: jest.fn()
            }))
        };
        global.bootstrap = mockBootstrap;
        
        // global.apiはモックしない（確立されたルール）
        // APIが存在しない場合の動作テストのため、undefinedのままにする
        

        
        // dialogs.js functions are available through require (for coverage)
        // Make functions available globally for easier testing
        Object.assign(global, dialogs);
    });

    afterEach(() => {
        cleanupDom();
        jest.clearAllMocks();
        jest.resetModules();
    });

    describe('Basic Function Availability', () => {
        test('dialogs.jsの全ての関数が正しく読み込まれている', () => {
            // Assert - requireで読み込んだ関数が存在することを確認
            expect(typeof dialogs.show_diag_alert).toBe('function');
            expect(typeof dialogs.show_fatal_error).toBe('function');
            expect(typeof dialogs.show_information).toBe('function');
            expect(typeof dialogs.show_warning).toBe('function');
            expect(typeof dialogs.make_code_dom).toBe('function');
            expect(typeof dialogs.show_login_diag).toBe('function');
            expect(typeof dialogs.show_logout_diag).toBe('function');
            
            // グローバルスコープでも利用可能であることを確認
            expect(typeof global.show_diag_alert).toBe('function');
            expect(typeof global.show_fatal_error).toBe('function');
            expect(typeof global.show_information).toBe('function');
            expect(typeof global.show_warning).toBe('function');
            expect(typeof global.make_code_dom).toBe('function');
            expect(typeof global.show_login_diag).toBe('function');
            expect(typeof global.show_logout_diag).toBe('function');
        });

        test('make_code_dom関数がnull値を適切に処理する', () => {
            // Act - null値での動作確認
            const result = global.make_code_dom(null);
            
            // Assert - 空文字列が返されることを確認
            expect(result).toBe('');
        });

        test('make_code_dom関数が実際のjQueryオブジェクトを使用する', () => {
            // Arrange - 実際のjQuery環境（JSDOMで提供される）
            // global.$が利用可能であることを確認
            expect(global.$).toBeDefined();
            
            // Act - 実際のコードでボタン作成
            const result = global.make_code_dom('function test() { return "hello"; }');
            
            // Assert - jQueryオブジェクトが返されることを確認
            expect(result).toBeDefined();
            expect(result.jquery).toBeDefined(); // jQueryオブジェクトの確認
            expect(result.length).toBe(1); // 1つの要素
            expect(result.hasClass('btn')).toBe(true); // ボタンクラスの確認
        });

        test('show_diag_alert関数の実際のDOM操作テスト', () => {
            // Arrange - 実際のDOM要素を作成
            const testDiv = document.createElement('div');
            testDiv.id = 'test_dialog';
            
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('name', 'alert');
            testDiv.appendChild(alertDiv);
            document.body.appendChild(testDiv);
            
            // jQueryオブジェクト作成
            const $dialog = global.$('#test_dialog');
            
            // Act - 実際のshow_diag_alert関数を実行
            expect(() => global.show_diag_alert($dialog, 'Test message', false)).not.toThrow();
            
            // Assert - DOM要素が更新されていることを確認
            const alertElement = document.querySelector('#test_dialog [name=alert]');
            expect(alertElement).toBeTruthy();
            expect(alertElement.children.length).toBeGreaterThan(0); // 子要素が追加されている
        });
    });

    describe('Modal Dialog Functions', () => {
        test('make_code_dom関数の基本動作確認', () => {
            // Arrange - 実際のjQuery環境を使用（モックしない）
            expect(global.$).toBeDefined(); // jQueryが利用可能であることを確認
            
            // Act - 基本的なコード表示ボタン作成
            const result = global.make_code_dom('test code');
            
            // Assert - jQueryオブジェクトが返されることを確認
            expect(result).toBeDefined();
            expect(result.jquery).toBeDefined(); // 実際のjQueryオブジェクト
            expect(result.length).toBe(1);
            expect(result.hasClass('btn')).toBe(true);
        });

        test('show_information関数の実際の実行テスト', async () => {
            // Arrange - information_diag要素を作成
            const infoDiv = document.createElement('div');
            infoDiv.id = 'information_diag';
            
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('name', 'alert');
            infoDiv.appendChild(alertDiv);
            document.body.appendChild(infoDiv);
            
            // モーダルイベントリスナーをシミュレート
            let modalHiddenCallback;
            const mockModal = {
                show: jest.fn(),
                hide: jest.fn()
            };
            mockBootstrap.Modal.mockReturnValue(mockModal);
            
            // jQueryのonイベントをモック
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector === '#information_diag') {
                    return {
                        find: jest.fn(() => ({
                            empty: jest.fn().mockReturnThis(),
                            append: jest.fn().mockReturnThis(),
                            find: jest.fn(() => ({
                                append: jest.fn(),
                                first: jest.fn(() => ({
                                    focus: jest.fn()
                                }))
                            }))
                        })),
                        on: jest.fn((event, callback) => {
                            if (event === 'hidden.bs.modal') {
                                modalHiddenCallback = callback;
                                // 即座にコールバックを実行してPromiseを解決
                                setTimeout(callback, 10);
                            }
                        })
                    };
                }
                return originalJQuery(selector);
            });
            
            // Act - 実際の関数実行
            const promise = global.show_information('Test information message', true);
            
            // Assert - プロミスが解決されることを確認
            await expect(promise).resolves.toBeUndefined();
            expect(mockBootstrap.Modal).toHaveBeenCalledWith('#information_diag');
            expect(mockModal.show).toHaveBeenCalled();
            
            // Cleanup
            global.$ = originalJQuery;
        });

        test('show_warning関数の実際の実行テスト', async () => {
            // Arrange - warning_diag要素を作成
            const warningDiv = document.createElement('div');
            warningDiv.id = 'warning_diag';
            
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('name', 'alert');
            warningDiv.appendChild(alertDiv);
            document.body.appendChild(warningDiv);
            
            const mockModal = {
                show: jest.fn(),
                hide: jest.fn()
            };
            mockBootstrap.Modal.mockReturnValue(mockModal);
            
            // jQueryのonイベントをモック
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector === '#warning_diag') {
                    return {
                        find: jest.fn(() => ({
                            empty: jest.fn().mockReturnThis(),
                            append: jest.fn().mockReturnThis(),
                            find: jest.fn(() => ({
                                append: jest.fn(),
                                first: jest.fn(() => ({
                                    focus: jest.fn()
                                }))
                            }))
                        })),
                        on: jest.fn((event, callback) => {
                            if (event === 'hidden.bs.modal') {
                                setTimeout(callback, 10);
                            }
                        })
                    };
                }
                return originalJQuery(selector);
            });
            
            // Act - 実際の関数実行
            const promise = global.show_warning('Test warning message');
            
            // Assert - プロミスが解決されることを確認
            await expect(promise).resolves.toBeUndefined();
            expect(mockBootstrap.Modal).toHaveBeenCalledWith('#warning_diag');
            expect(mockModal.show).toHaveBeenCalled();
            
            // Cleanup
            global.$ = originalJQuery;
        });

        test('show_fatal_error関数の実際の実行テスト', async () => {
            // Arrange - fatal_error要素を作成
            const fatalDiv = document.createElement('div');
            fatalDiv.id = 'fatal_error';
            
            const alertDiv = document.createElement('div');
            alertDiv.setAttribute('name', 'alert');
            fatalDiv.appendChild(alertDiv);
            document.body.appendChild(fatalDiv);
            
            const mockModal = {
                show: jest.fn(),
                hide: jest.fn()
            };
            mockBootstrap.Modal.mockReturnValue(mockModal);
            
            // jQueryのonイベントをモック
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector === '#fatal_error') {
                    return {
                        find: jest.fn(() => ({
                            empty: jest.fn().mockReturnThis(),
                            append: jest.fn().mockReturnThis(),
                            find: jest.fn(() => ({
                                append: jest.fn(),
                                first: jest.fn(() => ({
                                    focus: jest.fn()
                                }))
                            }))
                        })),
                        on: jest.fn((event, callback) => {
                            if (event === 'hidden.bs.modal') {
                                setTimeout(callback, 10);
                            }
                        })
                    };
                }
                return originalJQuery(selector);
            });
            
            // Act - 実際の関数実行
            const promise = global.show_fatal_error('Test fatal error message');
            
            // Assert - プロミスが解決されることを確認
            await expect(promise).resolves.toBeUndefined();
            expect(mockBootstrap.Modal).toHaveBeenCalledWith('#fatal_error');
            expect(mockModal.show).toHaveBeenCalled();
            
            // Cleanup
            global.$ = originalJQuery;
        });
    });

    describe('Code Viewer Functions', () => {
        test('make_code_dom関数がコード表示ボタンを作成する', () => {
            // Arrange - 実際のjQuery環境を使用
            expect(global.$).toBeDefined();
            
            const testCode = 'function test() { return "hello"; }';
            const testArgtypes = { param1: 'string', param2: 'number' };
            
            // Act - コードDOM作成
            const result = global.make_code_dom(testCode, testArgtypes);
            
            // Assert - 実際のjQueryオブジェクトが返されることを確認
            expect(result).toBeDefined();
            expect(result.jquery).toBeDefined();
            expect(result.hasClass('btn')).toBe(true);
            expect(result.hasClass('btn-outline-dark')).toBe(true);
        });

        test('make_code_dom関数がnullコードを適切に処理する', () => {
            // Act - nullコードの処理
            const result = global.make_code_dom(null);
            
            // Assert - 空文字列が返されることを確認
            expect(result).toBe('');
        });

        test('コード表示ボタンクリック処理の実行テスト', () => {
            // Arrange - view_code要素を作成
            const viewCodeDiv = document.createElement('div');
            viewCodeDiv.id = 'view_code';
            
            const argtypesDiv = document.createElement('div');
            argtypesDiv.setAttribute('name', 'argtypes');
            argtypesDiv.className = 'd-none';
            const argtypesControl = document.createElement('div');
            argtypesControl.className = 'form-control';
            argtypesDiv.appendChild(argtypesControl);
            viewCodeDiv.appendChild(argtypesDiv);
            
            const editorDiv = document.createElement('div');
            editorDiv.setAttribute('name', 'editor');
            viewCodeDiv.appendChild(editorDiv);
            
            document.body.appendChild(viewCodeDiv);
            
            const testCode = 'function test() { return "hello"; }';
            const testArgtypes = { param1: 'string', param2: 'number' };
            
            // Act - コードボタン作成とクリック実行
            const button = global.make_code_dom(testCode, testArgtypes);
            
            // Assert - ボタンが作成されていることを確認
            expect(button).toBeDefined();
            expect(button.jquery).toBeDefined();
            
            // ボタンクリックイベントを実際に発火（内部処理実行のため）
            expect(() => button.trigger('click')).not.toThrow();
            
            // Bootstrap Modalが呼び出されることを確認
            expect(mockBootstrap.Modal).toHaveBeenCalledWith('#view_code');
        });
    });

    describe('Authentication Dialog Functions', () => {
        test('show_logout_diag関数の実際の実行テスト', async () => {
            // Arrange - logout_diag要素を作成
            const logoutDiv = document.createElement('div');
            logoutDiv.id = 'logout_diag';
            
            const okButton = document.createElement('button');
            okButton.setAttribute('name', 'ok');
            logoutDiv.appendChild(okButton);
            
            document.body.appendChild(logoutDiv);
            
            const mockModal = {
                show: jest.fn(),
                hide: jest.fn()
            };
            mockBootstrap.Modal.mockReturnValue(mockModal);
            
            // jQueryイベント処理をモック
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector === '#logout_diag') {
                    return {
                        find: jest.fn(() => ({
                            off: jest.fn().mockReturnThis(),
                            on: jest.fn()
                        })),
                        on: jest.fn((event, callback) => {
                            if (event === 'hidden.bs.modal') {
                                setTimeout(callback, 10);
                            }
                        })
                    };
                }
                return originalJQuery(selector);
            });
            
            // Act - 実際の関数実行
            const promise = global.show_logout_diag();
            
            // Assert - プロミスが解決されることを確認
            await expect(promise).resolves.toBeUndefined();
            expect(mockBootstrap.Modal).toHaveBeenCalledWith(document.querySelector('#logout_diag'));
            expect(mockModal.show).toHaveBeenCalled();
            
            // Cleanup
            global.$ = originalJQuery;
        });
    });

    describe('Error Handling', () => {





    });

    describe('Integration Tests', () => {



    });

    describe('Boundary and Edge Cases', () => {
        test('空文字列やnull値での各関数の動作確認', () => {
            // Act & Assert - make_code_domの境界値テスト（jQueryをモックしない）
            expect(global.make_code_dom(null)).toBe('');
            expect(global.make_code_dom(undefined)).toBe('');
            
            // 実際のjQuery環境での動作確認
            expect(global.$).toBeDefined();
            const result = global.make_code_dom('');
            expect(result).toBeDefined();
            expect(result.jquery).toBeDefined();
        });



        test('異常なargtypes値での make_code_dom の動作確認', () => {
            // Arrange - 実際のjQuery環境を使用
            expect(global.$).toBeDefined();
            
            // Act & Assert - 異常なargtypes値での動作確認
            expect(() => global.make_code_dom('test', null)).not.toThrow();
            expect(() => global.make_code_dom('test', undefined)).not.toThrow();
            expect(() => global.make_code_dom('test', {})).not.toThrow();
            expect(() => global.make_code_dom('test', { invalid: null })).not.toThrow();
            
            // 結果の確認
            const result = global.make_code_dom('test', null);
            expect(result).toBeDefined();
            expect(result.jquery).toBeDefined();
        });


    });
});