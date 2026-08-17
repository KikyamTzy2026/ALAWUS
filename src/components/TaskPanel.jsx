import React, { useEffect, useState } from 'react';
import { completeTask } from '../firebase/gameService.js';

const SEQUENCE_LENGTH = 4;
const HOLD_DURATION = 1800; // ms
const MATCH_ITEMS = ['Invoice A', 'Invoice B', 'Invoice C', 'Invoice D'];

function SequenceGame({ onComplete }) {
  const [sequence] = useState(() =>
    Array.from({ length: SEQUENCE_LENGTH }, () => Math.floor(Math.random() * 4))
  );
  const [progress, setProgress] = useState(0);
  const arrows = ['↑', '↓', '←', '→'];

  const handlePress = (i) => {
    if (i === sequence[progress]) {
      const next = progress + 1;
      setProgress(next);
      if (next === sequence.length) onComplete();
    } else {
      setProgress(0);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="text-muted" style={{ fontSize: 13 }}>Repair sequence — click in order:</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
        {sequence.map((dir, i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 700,
              background: i < progress ? '#22c55e' : '#0a0f19',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {arrows[dir]}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {arrows.map((a, i) => (
          <button key={i} className="btn secondary" style={{ padding: '10px 16px' }} onClick={() => handlePress(i)}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function HoldGame({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (!holding) return undefined;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setPercent(pct);
      if (pct >= 100) {
        clearInterval(interval);
        onComplete();
      }
    }, 40);
    return () => clearInterval(interval);
  }, [holding, onComplete]);

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="text-muted" style={{ fontSize: 13 }}>Hold the button to complete the task:</p>
      <div className="loading-bar" style={{ width: 260, margin: '0 auto 18px' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: '#3b82f6', transition: 'width 0.04s linear' }} />
      </div>
      <button
        className="btn"
        onMouseDown={() => setHolding(true)}
        onMouseUp={() => { setHolding(false); setPercent(0); }}
        onMouseLeave={() => { setHolding(false); setPercent(0); }}
        onTouchStart={() => setHolding(true)}
        onTouchEnd={() => { setHolding(false); setPercent(0); }}
      >
        HOLD
      </button>
    </div>
  );
}

function SortGame({ onComplete }) {
  const [items, setItems] = useState(() => [...MATCH_ITEMS].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState([]);

  const handlePick = (item) => {
    const correctNext = MATCH_ITEMS[placed.length];
    if (item === correctNext) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setItems(items.filter((i) => i !== item));
      if (nextPlaced.length === MATCH_ITEMS.length) onComplete();
    } else {
      // wrong order - shake feedback via reshuffle penalty
      setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="text-muted" style={{ fontSize: 13 }}>Sort in order: {MATCH_ITEMS.join(' → ')}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        {placed.map((p) => (
          <div key={p} className="hud-pill" style={{ background: '#14532d' }}>{p}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <button key={item} className="btn secondary" onClick={() => handlePick(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchGame({ onComplete }) {
  const target = React.useMemo(() => Math.floor(Math.random() * 900) + 100, []);
  const [options] = useState(() => {
    const opts = new Set([target]);
    while (opts.size < 4) {
      opts.add(target + Math.floor(Math.random() * 40) - 20);
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="text-muted" style={{ fontSize: 13 }}>Select the invoice matching total: <b style={{ color: '#e6ebf5' }}>${target}</b></p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <button
            key={opt}
            className="btn secondary"
            onClick={() => opt === target && onComplete()}
          >
            ${opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TaskPanel({ roomId, task, onClose }) {
  if (!task) return null;

  const handleComplete = () => {
    completeTask(roomId, task.id);
    onClose();
  };

  return (
    <div className="meeting-overlay">
      <div className="panel fade-in" style={{ maxWidth: 460, width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 className="title-font" style={{ margin: 0, fontSize: 18 }}>{task.label}</h3>
          <button className="btn secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onClose}>
            CLOSE
          </button>
        </div>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>{task.room}</p>

        {task.type === 'sequence' && <SequenceGame onComplete={handleComplete} />}
        {task.type === 'hold' && <HoldGame onComplete={handleComplete} />}
        {task.type === 'sort' && <SortGame onComplete={handleComplete} />}
        {task.type === 'match' && <MatchGame onComplete={handleComplete} />}
      </div>
    </div>
  );
}
