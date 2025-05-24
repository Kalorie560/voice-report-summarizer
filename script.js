// グローバル変数
let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let audioContext;
let analyser;
let microphone;
let javascriptNode;

// DOM要素の取得
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordingStatus = document.getElementById('recordingStatus');
const statusText = document.getElementById('statusText');
const recordingTime = document.getElementById('recordingTime');
const reportSection = document.getElementById('reportSection');
const reportContent = document.getElementById('reportContent');
const copyButton = document.getElementById('copyButton');
const apiKeyInput = document.getElementById('apiKey');
const waveformContainer = document.getElementById('waveformContainer');
const waveformCanvas = document.getElementById('waveform');
const canvasContext = waveformCanvas.getContext('2d');

// APIキーの読み込み
window.addEventListener('load', () => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
});

// APIキーの保存
apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('gemini_api_key', apiKeyInput.value);
});

// 録音開始
startButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // MediaRecorderの設定
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processAudio(audioBlob);
        };
        
        // 波形表示の設定
        setupWaveform(stream);
        
        // 録音開始
        mediaRecorder.start();
        startTime = Date.now();
        
        // UI更新
        startButton.disabled = true;
        stopButton.disabled = false;
        recordingStatus.classList.add('recording');
        statusText.textContent = '録音中';
        
        // タイマー開始
        timerInterval = setInterval(updateTimer, 100);
        
    } catch (error) {
        console.error('マイクへのアクセスに失敗しました:', error);
        alert('マイクへのアクセスを許可してください。');
    }
});

// 録音停止
stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // 波形表示の停止
        if (microphone) {
            microphone.disconnect();
        }
        if (javascriptNode) {
            javascriptNode.disconnect();
        }
        if (audioContext) {
            audioContext.close();
        }
        
        // UI更新
        startButton.disabled = false;
        stopButton.disabled = true;
        recordingStatus.classList.remove('recording');
        statusText.textContent = '処理中';
        waveformContainer.classList.remove('active');
        
        // タイマー停止
        clearInterval(timerInterval);
    }
});

// 波形表示の設定
function setupWaveform(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
    
    waveformContainer.classList.add('active');
    waveformCanvas.width = waveformCanvas.offsetWidth;
    waveformCanvas.height = waveformCanvas.offsetHeight;
    
    javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        drawWaveform(array);
    };
}

// 波形の描画
function drawWaveform(array) {
    canvasContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    canvasContext.fillStyle = '#2563eb';
    
    const barWidth = (waveformCanvas.width / array.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < array.length; i++) {
        barHeight = (array[i] / 255) * waveformCanvas.height;
        
        canvasContext.fillRect(x, waveformCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// タイマー更新
function updateTimer() {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 音声処理と報告書生成
async function processAudio(audioBlob) {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert('Gemini APIキーを入力してください。');
        statusText.textContent = '待機中';
        return;
    }
    
    // 報告書セクションを表示
    reportSection.style.display = 'block';
    reportContent.innerHTML = '<div class="loading">報告書を生成中...</div>';
    copyButton.style.display = 'none';
    
    try {
        // 音声をBase64に変換
        const base64Audio = await blobToBase64(audioBlob);
        
        // Gemini APIを呼び出し
        const report = await generateReport(base64Audio, apiKey);
        
        // 報告書を表示
        displayReport(report);
        statusText.textContent = '完了';
        
    } catch (error) {
        console.error('エラー:', error);
        reportContent.innerHTML = `<div style="color: #dc2626;">エラーが発生しました: ${error.message}</div>`;
        statusText.textContent = 'エラー';
    }
}

// BlobをBase64に変換
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Gemini APIを使用して報告書を生成
async function generateReport(base64Audio, apiKey) {
    const prompt = `以下の音声内容から、現場報告書を作成してください。

報告書には以下の項目を含めてください：
1. 日時：報告の日時（現在の日時を使用）
2. 状況：現場の状況の要約
3. 緊急性：高・中・低の3段階で評価
4. 報告内容：詳細な報告内容
5. 対応事項：必要な対応や推奨事項

音声の内容を正確に把握し、専門的かつ簡潔な報告書として整理してください。`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: 'audio/webm',
                            data: base64Audio
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 1024,
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '報告書の生成に失敗しました');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 報告書の表示
function displayReport(report) {
    // 報告書を整形して表示
    const formattedReport = formatReport(report);
    reportContent.innerHTML = formattedReport;
    copyButton.style.display = 'block';
}

// 報告書の整形
function formatReport(report) {
    // 緊急性のキーワードを検出してスタイルを適用
    let formatted = report
        .replace(/日時[：:]/g, '<span class="report-label">日時：</span>')
        .replace(/状況[：:]/g, '<span class="report-label">状況：</span>')
        .replace(/緊急性[：:]/g, '<span class="report-label">緊急性：</span>')
        .replace(/報告内容[：:]/g, '<span class="report-label">報告内容：</span>')
        .replace(/対応事項[：:]/g, '<span class="report-label">対応事項：</span>');
    
    // 緊急性レベルのスタイリング
    formatted = formatted
        .replace(/高/g, '<span class="urgency-high">高</span>')
        .replace(/中/g, '<span class="urgency-medium">中</span>')
        .replace(/低/g, '<span class="urgency-low">低</span>');
    
    // 改行を適切に処理
    const lines = formatted.split('\n');
    const sections = [];
    let currentSection = [];
    
    lines.forEach(line => {
        if (line.includes('report-label')) {
            if (currentSection.length > 0) {
                sections.push(currentSection.join('<br>'));
            }
            currentSection = [line];
        } else if (line.trim()) {
            currentSection.push(line);
        }
    });
    
    if (currentSection.length > 0) {
        sections.push(currentSection.join('<br>'));
    }
    
    return sections.map(section => `<div class="report-item">${section}</div>`).join('');
}

// クリップボードにコピー
copyButton.addEventListener('click', () => {
    const reportText = reportContent.innerText;
    navigator.clipboard.writeText(reportText).then(() => {
        copyButton.textContent = 'コピーしました！';
        setTimeout(() => {
            copyButton.textContent = 'クリップボードにコピー';
        }, 2000);
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました。');
    });
});