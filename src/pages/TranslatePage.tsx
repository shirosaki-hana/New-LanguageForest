import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslateStore } from '../stores/translateStore';
import { TranslateHeader, TranslatePanel } from '../components/translate';
import HistoryDrawer from '../components/HistoryDrawer';
import type { TranslationHistoryItem } from '../stores/historyStore';

export default function TranslatePage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { loadModels, setSourceText, setTranslatedText } = useTranslateStore();

  // 히스토리에서 선택한 항목 불러오기
  const handleSelectHistory = (item: TranslationHistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
  };

  // 최초 접속 시 모델 목록 불러오기
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return (
    <Box
      component='main'
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <TranslateHeader onHistoryClick={() => setHistoryOpen(true)} />
      <TranslatePanel />

      {/* 히스토리 Drawer */}
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onSelectHistory={handleSelectHistory} />
    </Box>
  );
}
