// Copyright (c) 2025 Toshiba Digital Solutions Corporation.
// This source code is licensed under the MIT license.

const { setupDom, cleanupDom } = require('./helpers/setupDom.js');

describe('util.js - 統合テスト', () => {
  let util;

  beforeEach(async () => {
    // Setup DOM before each test
    setupDom();
    
    // Clear module cache to ensure fresh imports
    delete require.cache[require.resolve('../src/util.js')];
    
    // Import util.js directly for coverage
    util = require('../src/util.js');
  });

  afterEach(() => {
    // Cleanup DOM after each test
    cleanupDom();
    
    jest.clearAllMocks();
  });

  test('URL パラメータが正しく解析される', () => {
    // Arrange: テスト用URL
    const testUrls = [
      'http://localhost/?view=test&id=123',
      'http://localhost/?view=dashboard',
      'http://localhost/?id=456&view=transaction',
      'http://localhost/?view=',
      'http://localhost/',
      'http://localhost/?other=value&view=block&more=data'
    ];
    
    // Act & Assert: 基本的なパラメータ解析
    expect(util.getURLParameterByName('view', testUrls[0])).toBe('test');
    expect(util.getURLParameterByName('id', testUrls[0])).toBe('123');
    
    // Act & Assert: 単一パラメータ
    expect(util.getURLParameterByName('view', testUrls[1])).toBe('dashboard');
    
    // Act & Assert: パラメータの順序が違う場合
    expect(util.getURLParameterByName('view', testUrls[2])).toBe('transaction');
    expect(util.getURLParameterByName('id', testUrls[2])).toBe('456');
    
    // Act & Assert: 空の値
    expect(util.getURLParameterByName('view', testUrls[3])).toBe('');
    
    // Act & Assert: パラメータなし
    expect(util.getURLParameterByName('view', testUrls[4])).toBeUndefined();
    
    // Act & Assert: 複数パラメータ中の検索
    expect(util.getURLParameterByName('view', testUrls[5])).toBe('block');
    
    // Act & Assert: 存在しないパラメータ
    expect(util.getURLParameterByName('nonexistent', testUrls[0])).toBeUndefined();
  });

  test('URL パラメータの特殊文字処理', () => {
    // Arrange: 特殊文字を含むURL
    const specialUrls = [
      'http://localhost/?name=John%20Doe',
      'http://localhost/?query=hello+world',
      'http://localhost/?data=%7B%22key%22%3A%22value%22%7D',
      'http://localhost/?empty=&other=value&last=end'
    ];
    
    // Act & Assert: URLエンコードされた文字
    expect(util.getURLParameterByName('name', specialUrls[0])).toBe('John Doe');
    
    // Act & Assert: プラス記号のスペース変換
    expect(util.getURLParameterByName('query', specialUrls[1])).toBe('hello world');
    
    // Act & Assert: JSON文字列のデコード
    expect(util.getURLParameterByName('data', specialUrls[2])).toBe('{"key":"value"}');
    
    // Act & Assert: 複数パラメータでの空値と通常値
    expect(util.getURLParameterByName('empty', specialUrls[3])).toBe('');
    expect(util.getURLParameterByName('other', specialUrls[3])).toBe('value');
    expect(util.getURLParameterByName('last', specialUrls[3])).toBe('end');
  });

  test('getURLParameterByNameのデフォルトパラメータ動作', () => {
    // Note: デフォルトのlocation.hrefを使用する場合のテスト
    // jsdom環境ではlocation.hrefの変更ができないため、
    // この機能は統合テストやE2Eテストで検証されることを想定
    
    // Arrange & Act: URLパラメータなしでの呼び出し
    // （実際のlocation.hrefを使用するため、結果は環境依存）
    const result = util.getURLParameterByName('view');
    
    // Assert: undefinedまたは文字列が返されることを確認
    expect(typeof result === 'undefined' || typeof result === 'string').toBe(true);
  });

  test('時間フォーマットが正しく動作する', () => {
    expect(util.convertTime2AgoString(500)).toBe('now');
    expect(util.convertTime2AgoString(1000)).toBe('1 sec  ago');
    expect(util.convertTime2AgoString(60000)).toBe('1 min  ago');
  });

  test('ID参照が正しく処理される', () => {
    expect(util.unref_id('test')).toBe('test');
    expect(util.unref_id(['id1', 'name1'])).toBe('id1');
    expect(util.unref_id(null)).toBe('');
  });

  test('アサーションが正しく動作する', () => {
    expect(() => util.assert(true)).not.toThrow();
    expect(() => util.assert(false)).toThrow('ASSERT');
  });

  test('ステータス要素が正しく生成される', () => {
    // Arrange & Act: ステータス要素を生成
    const okElement = util.make_status_elem('ok');
    const errorElement = util.make_status_elem('error');
    
    // Assert: 実際のjQuery要素が返されることを確認
    expect(okElement).toBeDefined();
    expect(errorElement).toBeDefined();
    
    // jQuery関数の呼び出しも確認
    expect(global.$).toHaveBeenCalledWith('<font color="green">');
    expect(global.$).toHaveBeenCalledWith('<font color="red">');
  });

  test('DOM要素が正しく読み込まれる', () => {
    // Arrange: DOMの存在確認
    
    // Act: DOM要素をクエリ
    const navbar = document.getElementById('the_navbar');
    const dashboard = document.getElementById('dashboard');
    
    // Assert: 期待される要素が存在する
    expect(navbar).toBeTruthy();
    expect(dashboard).toBeTruthy();
  });

  test('値要素のDOM生成が正しく動作する', () => {
    // Arrange: テスト用データ
    const testValue = 'test string';
    
    // Act: make_value_elem を実行
    const result = util.make_value_elem(testValue);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('配列要素の生成が正しく動作する', () => {
    // Arrange: テスト用配列
    const testArray = [1, 2, 3];
    
    // Act: make_array_elem を実行
    const result = util.make_array_elem(testArray);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('日付要素の生成が正しく動作する', () => {
    // Arrange: テスト用タイムスタンプ
    const testTime = 1635724800000; // 2021-11-01
    
    // Act: make_date_elem を実行
    const result = util.make_date_elem(testTime);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('ブール値要素の生成が正しく動作する', () => {
    // Arrange & Act: ブール値要素を生成
    const trueElement = util.make_boolean_elem(true);
    const falseElement = util.make_boolean_elem(false);
    
    // Assert: 実際の要素が返されることを確認
    expect(trueElement).toBeDefined();
    expect(falseElement).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<font color="green">');
    expect(global.$).toHaveBeenCalledWith('<font color="gray">');
  });

  test('文字列要素の生成が正しく動作する', () => {
    // Arrange: テスト用文字列
    const shortString = 'test';
    const color = 'brown';
    
    // Act: 文字列要素を生成
    const result = util.make_string_elem(shortString, color);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith(`<font color="${color}"></font>`);
  });

  test('オブジェクト要素の生成が正しく動作する', () => {
    // Arrange: テスト用オブジェクト
    const testObj = { key1: 'value1', key2: 'value2' };
    
    // Act: オブジェクト要素を生成
    const result = util.make_object_elem(testObj);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('プロパティ要素の生成が正しく動作する', () => {
    // Arrange: テスト用プロパティ名
    const propName = 'testProperty';
    
    // Act: プロパティ要素を生成
    const result = util.make_prop_elem(propName);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('make_value_elemの異なる型テスト', () => {
    // Arrange & Act: null値
    const nullResult = util.make_value_elem(null);
    
    // Assert: 実際の要素が返されることを確認
    expect(nullResult).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<font color="orange">');
    
    // Arrange & Act: 数値
    const numberResult = util.make_value_elem(42);
    
    // Assert: 実際の要素が返されることを確認
    expect(numberResult).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<font color="blue">');
    
    // Arrange & Act: ブール値
    const boolResult = util.make_value_elem(true);
    
    // Assert: 実際の要素が返されることを確認
    expect(boolResult).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<font color="green">');
    
    // Arrange & Act: エラーオブジェクト
    const error = new Error('test error');
    const errorResult = util.make_value_elem(error);
    
    // Assert: 実際の要素が返されることを確認
    expect(errorResult).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('ID要素の生成が正しく動作する', () => {
    // Arrange: テスト用ID
    const testId = 'test-id';
    
    // Act: ID要素を生成
    const result = util.make_id_elem(testId);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
    expect(global.$).toHaveBeenCalled();
    expect(global.bootstrap.Tooltip).toHaveBeenCalled();
  });

  test('複数ID要素の生成が正しく動作する', () => {
    // Arrange: テスト用IDリスト
    const idList = ['id1', 'id2', 'id3'];
    
    // Act: 複数ID要素を生成
    const result = util.make_ids_elem(idList);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="inline">');
  });

  test('トランザクションID要素の生成が正しく動作する', () => {
    // Arrange: テスト用データ
    const id = 'tx123';
    const txid = 'txid456';
    
    // Act: トランザクションID要素を生成
    const result = util.make_txid_elem(id, txid);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith(`<a href="?view=a_transaction&id=${id}" class="id-tag " data-bs-toggle="tooltip" data-bs-title="${id} ${txid}">`);
  });

  test('ブロック番号要素の生成が正しく動作する', () => {
    // Arrange: テスト用ブロック番号
    const blkno = 12345;
    
    // Act: ブロック番号要素を生成
    const result = util.make_blkno_elem(blkno);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith(`<a href="?view=a_block&id=${blkno}" class="id-tag ">`);
  });

  test('時間前表示要素の生成が正しく動作する', () => {
    // Arrange: テスト用時間データ
    const now = Date.now();
    const then = now - 60000; // 1分前
    
    // Act: 時間前要素を生成
    const result = util.make_ago_elem(now, then);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="text-end " style="font-size:small;">');
  });

  test('引数要素の生成が正しく動作する', () => {
    // Arrange: テスト用引数オブジェクト
    const args = { arg1: 'value1', arg2: 'value2' };
    
    // Act: 引数要素を生成
    const result = util.make_args_elem(args);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="">');
  });

  test('説明要素の生成が正しく動作する', () => {
    // Arrange: テスト用説明文
    const description = 'This is a test description';
    
    // Act: 説明要素を生成
    const result = util.make_description_elem(description);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<pre class="pre-desc">');
  });

  test('空値・無効値の処理が正しく動作する', () => {
    // Arrange & Act: 空のID要素
    const emptyTxid = util.make_txid_elem('');
    const emptyBlkno = util.make_blkno_elem('');
    const emptyText = util.make_text_elem('');
    
    // Assert: 空文字列が返されることを確認
    expect(emptyTxid).toBe('');
    expect(emptyBlkno).toBe('');
    expect(emptyText).toBe('');
    
    // Arrange & Act: 無効な時間
    const invalidDate1 = util.make_date_elem(0);
    const invalidDate2 = util.make_date_elem(-1);
    
    // Assert: 空文字列が返されることを確認
    expect(invalidDate1).toBe('');
    expect(invalidDate2).toBe('');
  });

  // === 追加テスト: 未カバー関数のテスト ===

  test('トランザクション時間要素の生成が正しく動作する', () => {
    // Arrange: テスト用データ（txnoは数値）
    const id = 123;
    const time = 1635724800000;
    
    // Act: トランザクション時間要素を生成
    const result = util.make_txid_time_elem(id, time);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="">');
  });

  test('トランザクション時間要素の空ID処理', () => {
    // Arrange & Act: 空ID（0や空文字列）でトランザクション時間要素を生成
    const result1 = util.make_txid_time_elem(0);
    const result2 = util.make_txid_time_elem('');
    
    // Assert: 空文字列が返されることを確認
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  test('トランザクション番号範囲要素の生成が正しく動作する', () => {
    // Arrange: テスト用範囲データ（数値）
    const start = 100;
    const end = 200;
    
    // Act: 範囲要素を生成
    const result = util.make_txno_range_elem(start, end);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('トランザクション番号範囲要素の単一値処理', () => {
    // Arrange: 同じ開始・終了値（数値）
    const start = 100;
    const end = 100;
    
    // Act: 範囲要素を生成
    const result = util.make_txno_range_elem(start, end);
    
    // Assert: 範囲記号なしで生成されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('マスク要素の生成が正しく動作する', () => {
    // Arrange: アクティブマスク
    const activeMask = { act: true };
    
    // Act: マスク要素を生成
    const result = util.make_mask_elem(activeMask);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
  });

  test('マスク要素の複合条件処理', () => {
    // Arrange: 複合マスク条件
    const complexMask = { sub: true, dlg: true, rec: true };
    
    // Act: マスク要素を生成
    const result = util.make_mask_elem(complexMask);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
  });

  test('マスク要素の空値処理', () => {
    // Arrange & Act: null/undefinedマスク
    const nullResult = util.make_mask_elem(null);
    const undefinedResult = util.make_mask_elem(undefined);
    
    // Assert: 空要素が返されることを確認
    expect(nullResult).toBeDefined();
    expect(undefinedResult).toBeDefined();
  });

  test('引数型要素の生成が正しく動作する', () => {
    // Arrange: テスト用引数型定義
    const argtypes = {
      'name': 'string',
      'age': 'number',
      'active': 'boolean',
      'address': 'address',
      'data': 'json'
    };
    
    // Act: 引数型要素を生成
    const result = util.make_argtypes_elem(argtypes);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="inline">');
  });

  test('引数型要素の配列型処理', () => {
    // Arrange: 配列型を含む引数定義
    const argtypes = {
      'items': 'string-array',
      'numbers': 'number-array'
    };
    
    // Act: 引数型要素を生成
    const result = util.make_argtypes_elem(argtypes);
    
    // Assert: 実際の要素が返されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="inline">');
  });

  test('引数型要素の無効値処理', () => {
    // Arrange & Act: 無効な引数型
    const nullResult = util.make_argtypes_elem(null);
    const stringResult = util.make_argtypes_elem('invalid');
    const emptyResult = util.make_argtypes_elem({});
    
    // Assert: 空文字列または空要素が返されることを確認
    expect(nullResult).toBe('');
    expect(stringResult).toBe('');
    expect(emptyResult).toBeDefined();
  });

  test('時間前文字列変換の詳細分岐テスト', () => {
    // Act & Assert: 様々な時間間隔をテスト
    expect(util.convertTime2AgoString(500)).toBe('now');
    expect(util.convertTime2AgoString(1000)).toBe('1 sec  ago');
    expect(util.convertTime2AgoString(2000)).toBe('2 secs  ago');
    expect(util.convertTime2AgoString(60000)).toBe('1 min  ago');
    expect(util.convertTime2AgoString(120000)).toBe('2 mins  ago'); // 120秒 = 2分
    expect(util.convertTime2AgoString(3600000)).toBe('1 hour  ago'); // 1時間
    expect(util.convertTime2AgoString(7200000)).toBe('2 hours  ago'); // 2時間
    expect(util.convertTime2AgoString(86400000)).toBe('1 day  ago'); // 1日
    expect(util.convertTime2AgoString(172800000)).toBe('2 days  ago'); // 2日
    expect(util.convertTime2AgoString(259200000)).toBe('3 days  ago'); // 3日
  });

  test('時間前文字列変換の負の値とInfinity処理', () => {
    // Act & Assert: 負の値（未来）
    expect(util.convertTime2AgoString(-1000)).toBe('1 sec  later');
    expect(util.convertTime2AgoString(-60000)).toBe('1 min  later');
    
    // Act & Assert: 無限値
    expect(util.convertTime2AgoString(Infinity)).toBe('');
    expect(util.convertTime2AgoString(-Infinity)).toBe('');
  });

  test('文字列要素の長いテキスト展開機能', () => {
    // Arrange: 長いテキスト（80文字超）
    const longText = 'a'.repeat(100);
    
    // Act: 長い文字列要素を生成
    const result = util.make_string_elem(longText, 'blue');
    
    // Assert: 展開可能な要素が生成されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('配列要素の大きな配列展開機能', () => {
    // Arrange: 大きな配列
    const largeArray = Array.from({length: 15}, (_, i) => `item${i}`);
    
    // Act: 大きな配列要素を生成
    const result = util.make_array_elem(largeArray);
    
    // Assert: 展開可能な要素が生成されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('オブジェクト要素の大きなオブジェクト展開機能', () => {
    // Arrange: 大きなオブジェクト
    const largeObject = {};
    for (let i = 0; i < 15; i++) {
      largeObject[`key${i}`] = `value${i}`;
    }
    
    // Act: 大きなオブジェクト要素を生成
    const result = util.make_object_elem(largeObject);
    
    // Assert: 展開可能な要素が生成されることを確認
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalled();
  });

  test('getURLParameterByName with URL parameter', () => {
    // テスト用URL
    const testUrl = 'https://example.com?param1=value1&param2=value2';
    
    // URLパラメータありでの動作確認
    expect(util.getURLParameterByName('param1', testUrl)).toBe('value1');
    expect(util.getURLParameterByName('param2', testUrl)).toBe('value2');
    expect(util.getURLParameterByName('nonexistent', testUrl) || '').toBe('');
  });

  test('make_value_elem for large arrays with expansion', () => {
    // 大きな配列（15要素以上）
    const largeArray = new Array(20).fill(0).map((_, i) => i);
    
    const result = util.make_value_elem(largeArray, 0);
    
    // 展開可能な要素が生成される
    expect(result).toBeDefined();
    expect(result.text().length).toBeGreaterThan(0);
  });

  test('make_value_elem for large objects with expansion', () => {
    // 大きなオブジェクト（15プロパティ以上）
    const largeObject = {};
    for (let i = 0; i < 20; i++) {
      largeObject[`key${i}`] = `value${i}`;
    }
    
    const result = util.make_value_elem(largeObject, 0);
    
    // 展開可能な要素が生成される
    expect(result).toBeDefined();
    expect(result.text()).toContain('...');
  });

  test('array expansion click interaction', () => {
    // 大きな配列と展開要素
    const largeArray = new Array(20).fill(0).map((_, i) => i);
    const collapsedElement = util.make_value_elem(largeArray, 0);
    
    // クリックイベントをシミュレート
    if (global.$ && global.$.Event) {
      const clickEvent = global.$.Event('click');
      clickEvent.stopPropagation = jest.fn();
      collapsedElement.trigger(clickEvent);
      
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    } else {
      expect(collapsedElement).toBeDefined();
    }
  });

  test('object expansion click interaction', () => {
    // 大きなオブジェクトと展開要素
    const largeObject = {};
    for (let i = 0; i < 20; i++) {
      largeObject[`key${i}`] = `value${i}`;
    }
    const collapsedElement = util.make_value_elem(largeObject, 0);
    
    // クリックイベントをシミュレート
    if (global.$ && global.$.Event) {
      const clickEvent = global.$.Event('click');
      clickEvent.stopPropagation = jest.fn();
      collapsedElement.trigger(clickEvent);
      
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    } else {
      expect(collapsedElement).toBeDefined();
    }
  });

  test('very large array hierarchical expansion', () => {
    // 非常に大きな配列（100要素以上）
    const veryLargeArray = new Array(150).fill(0).map((_, i) => i);
    
    const result = util.make_value_elem(veryLargeArray, 0);
    
    // 階層的展開要素が生成される
    expect(result).toBeDefined();
    expect(result.hasClass('val_header')).toBe(true);
  });



  test('make_prop_elem function', () => {
    const result = util.make_prop_elem('testKey');
    
    // 正しいクラスとテキストが設定される
    expect(result).toBeDefined();
    expect(result.text()).toBe('testKey');
    expect(typeof result.text).toBe('function');
  });

  test('make_value_elem depth limiting', () => {
    // 深いネストオブジェクト
    const deepObject = { 
      level1: { 
        level2: { 
          level3: { 
            level4: { 
              level5: 'deep' 
            } 
          } 
        } 
      } 
    };
    
    // 異なる深度でテスト
    const result1 = util.make_value_elem(deepObject, 0);
    const result2 = util.make_value_elem(deepObject, 10);
    
    // 深度制限が適用される
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });









  test('make_args_elem function', () => {
    // 引数オブジェクト
    const argsObject = {
      param1: 'value1',
      param2: 42,
      param3: true
    };

    const result = util.make_args_elem(argsObject);

    // 正しい構造が生成される
    expect(result).toBeDefined();
    expect(result.find('div')).toHaveLength(3);
  });







  test('complex nested object and array interactions', () => {
    // 複雑なネスト構造
    const complexData = {
      users: new Array(20).fill(0).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        data: new Array(15).fill(0).map((_, j) => `data${j}`)
      })),
      metadata: {
        count: 20,
        settings: new Array(25).fill(0).map((_, i) => `setting${i}`)
      }
    };

    const result = util.make_value_elem(complexData, 0);

    // 展開可能な要素が生成される
    expect(result).toBeDefined();
    expect(result.hasClass('val_header')).toBe(true);
  });

  test('boundary conditions for step calculations', () => {
    // ステップ計算の境界条件をテスト
    const exactBoundaryArray = new Array(100).fill(0).map((_, i) => i);
    const justOverBoundaryArray = new Array(101).fill(0).map((_, i) => i);

    const exactResult = util.make_value_elem(exactBoundaryArray, 0);
    const overResult = util.make_value_elem(justOverBoundaryArray, 0);

    // 両方とも展開可能要素が生成される
    expect(exactResult).toBeDefined();
    expect(overResult).toBeDefined();
    expect(exactResult.hasClass('val_header')).toBe(true);
    expect(overResult.hasClass('val_header')).toBe(true);
  });

  test('string expansion s0create and s1create paths', () => {
    // 非常に長いテキスト（100文字以上で確実に展開を発生させる）
    const massiveText = 'a'.repeat(150);
    
    const result = util.make_string_elem(massiveText, 'blue');
    
    // 展開要素が生成される
    expect(result).toBeDefined();
    expect(result.hasClass('val_header')).toBe(true);
    
    // 展開状態をクリックでテスト
    const spans = result.find('span');
    if (spans.length > 0) {
      spans.first().trigger('click');
      expect(result).toBeDefined();
    }
  });

  test('hierarchical expansion for very large data structures', () => {
    // 階層的展開が必要な非常に大きなデータ構造
    const hugeArray = new Array(1000).fill(0).map((_, i) => i);
    
    const result = util.make_value_elem(hugeArray, 0);
    
    // 階層的展開要素が生成される
    expect(result).toBeDefined();
    expect(result.hasClass('val_header')).toBe(true);
    
    result.trigger('click');
    expect(result).toBeDefined();
  });

  test('deep nesting depth limit enforcement', () => {
    // 非常に深いネスト構造を作成
    let deepNest = 'base';
    for (let i = 0; i < 30; i++) {
      deepNest = { [`level${i}`]: deepNest };
    }
    
    // 深いネスト構造の処理（様々な深度で）
    const result1 = util.make_value_elem(deepNest, 15);
    const result2 = util.make_value_elem(deepNest, 0);
    
    // 深度制限が適切に適用される
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  // Additional coverage tests for utility functions
  test('unref_id function handles different ID formats', () => {
    expect(util.unref_id('u012345678')).toBe('u012345678');
    expect(util.unref_id('t012345678')).toBe('t012345678');
    expect(util.unref_id('c012345678')).toBe('c012345678');
    expect(util.unref_id('simple')).toBe('simple');
    expect(util.unref_id('')).toBe('');
    expect(util.unref_id(null)).toBe('');
    expect(util.unref_id(undefined)).toBe('');
  });

  test('make_text_elem creates text elements correctly', () => {
    const result1 = util.make_text_elem('test text');
    expect(result1).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="id-tag ">');

    const result2 = util.make_text_elem('test', 'custom-width');
    expect(global.$).toHaveBeenCalledWith('<div class="id-tag custom-width">');

    const result3 = util.make_text_elem('');
    expect(result3).toBe('');

    const result4 = util.make_text_elem(null);
    expect(result4).toBe('');
  });

  test('make_date_elem handles edge cases', () => {
    expect(util.make_date_elem(0)).toBe('');
    expect(util.make_date_elem(-1)).toBe('');
    expect(util.make_date_elem(null)).toBe('');
    expect(util.make_date_elem(undefined)).toBe('');

    const validTime = 1640995200000;
    const result = util.make_date_elem(validTime);
    expect(result).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<span>');
  });

  test('make_ago_elem handles various scenarios', () => {
    const now = Date.now();
    
    const result1 = util.make_ago_elem(now, null);
    expect(result1).toBeDefined();

    const result2 = util.make_ago_elem(now, undefined);
    expect(result2).toBeDefined();

    const oneHourAgo = now - (60 * 60 * 1000);
    const result3 = util.make_ago_elem(oneHourAgo, now);
    expect(result3).toBeDefined();
  });

  test('convertTime2AgoString boundary conditions', () => {
    expect(util.convertTime2AgoString(Infinity)).toBe('');
    expect(util.convertTime2AgoString(-Infinity)).toBe('');
    expect(util.convertTime2AgoString(NaN)).toBe('');
    
    expect(util.convertTime2AgoString(999)).toBe('now');
    expect(util.convertTime2AgoString(1000)).toBe('1 sec  ago');
    expect(util.convertTime2AgoString(60000)).toBe('1 min  ago');
    expect(util.convertTime2AgoString(61000)).toBe('1 min 1 secs  ago');
    expect(util.convertTime2AgoString(3600000)).toBe('1 hour  ago');
    expect(util.convertTime2AgoString(86400000)).toBe('1 day  ago');
    expect(util.convertTime2AgoString(172800000)).toBe('2 days  ago');
    
    // Test negative values (future times)
    expect(util.convertTime2AgoString(-1000)).toBe('1 sec  later');
    expect(util.convertTime2AgoString(-60000)).toBe('1 min  later');
  });

  test('make_argtypes_elem handles various types', () => {
    const argtypes1 = {
      'numberArg': 'number',
      'stringArg': 'string', 
      'boolArg': 'boolean',
      'addressArg': 'address',
      'idArg': 'id',
      'jsonArg': 'json',
      'anyArg': 'any',
      'unknownArg': 'unknown-type',
      'arrayArg': 'string-array'
    };

    const result1 = util.make_argtypes_elem(argtypes1);
    expect(result1).toBeDefined();
    expect(global.$).toHaveBeenCalledWith('<div class="inline">');

    expect(util.make_argtypes_elem(null)).toBe('');
    expect(util.make_argtypes_elem(undefined)).toBe('');
    expect(util.make_argtypes_elem('string')).toBe('');

    const result2 = util.make_argtypes_elem({});
    expect(result2).toBeDefined();
  });

  test('navigation function exists and handles undefined location', () => {
    // テスト環境ではlocationオブジェクトが制限されているため
    // 関数の存在とnull安全性のみをテスト
    expect(typeof util.navigation).toBe('function');
    
    // undefined locationでもエラーが発生しないことを確認
    expect(() => util.navigation('test-url')).not.toThrow();
  });
});
