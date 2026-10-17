import { useApiSettings } from "./api";

const failOptions = [0, 0.3, 0.5, 1];

export default function ApiPanel() {
  const { latency, failRate, logs, setLatency, setFailRate, clearLogs } =
    useApiSettings();

  return (
    <div className="api-panel">
      <div className="api-controls">
        <label>
          延遲 {latency} ms
          <input
            type="range"
            min={0}
            max={4000}
            step={100}
            value={latency}
            onChange={(e) => setLatency(Number(e.target.value))}
          />
        </label>
        <label>
          失敗率
          <select
            value={failRate}
            onChange={(e) => setFailRate(Number(e.target.value))}
          >
            {failOptions.map((rate) => (
              <option key={rate} value={rate}>
                {rate * 100}%
              </option>
            ))}
          </select>
        </label>
        <button onClick={clearLogs}>清除紀錄</button>
      </div>
      <ul className="api-log">
        {logs.length === 0 && <li className="hint">還沒有任何請求</li>}
        {logs.map((log) => (
          <li key={log.id} className={`api-log-${log.status}`}>
            <span>{log.time}</span>
            <strong>{log.method}</strong>
            <span>{log.detail}</span>
            <span>{log.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
