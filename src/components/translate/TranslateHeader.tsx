import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, IconButton, Tooltip, FormControl, Select, MenuItem, CircularProgress } from '@mui/material';
import { Translate as TranslateIcon, Settings as SettingsIcon, History as HistoryIcon } from '@mui/icons-material';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslateStore } from '../../stores/translateStore';
import { LANGUAGE_PAIRS } from '../../config/languagePairs';

interface TranslateHeaderProps {
  onHistoryClick: () => void;
}

export default function TranslateHeader({ onHistoryClick }: TranslateHeaderProps) {
  const { t } = useTranslation();
  const { openSettings } = useSettingsStore();
  const { models, selectedModel, isLoadingModels, isTranslating, setSelectedModel, selectedPairId, setSelectedPairId } =
    useTranslateStore();

  return (
    <Stack
      direction='row'
      alignItems='center'
      spacing={1.5}
      sx={theme => ({
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(2,6,23,0.7)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      })}
    >
      {/* 앱 로고 + 타이틀 (간소화) */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(124,58,237,0.9))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TranslateIcon sx={{ fontSize: 18, color: 'white' }} />
      </Box>
      <Typography
        variant='subtitle1'
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          flexShrink: 0,
        }}
      >
        {t('common.appName')}
      </Typography>

      {/* 언어쌍 선택 */}
      <FormControl size='small' sx={{ minWidth: 150, ml: 1 }}>
        <Select
          value={selectedPairId}
          onChange={e => setSelectedPairId(e.target.value)}
          disabled={isTranslating}
          sx={{
            '& .MuiSelect-select': {
              py: 0.75,
              fontSize: '0.875rem',
            },
          }}
        >
          {LANGUAGE_PAIRS.map(pair => (
            <MenuItem key={pair.id} value={pair.id}>
              {pair.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 모델 선택 (인라인) */}
      <FormControl size='small' sx={{ minWidth: 180 }}>
        <Select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          disabled={isLoadingModels || isTranslating}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              py: 0.75,
              fontSize: '0.875rem',
            },
          }}
        >
          {isLoadingModels ? (
            <MenuItem disabled>
              <CircularProgress size={14} sx={{ mr: 1 }} />
              {t('translate.modelLoading')}
            </MenuItem>
          ) : models.length === 0 ? (
            <MenuItem disabled>{t('translate.noModels')}</MenuItem>
          ) : (
            models.map(model => (
              <MenuItem key={model.name} value={model.name}>
                {model.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* 스페이서 */}
      <Box sx={{ flex: 1 }} />

      {/* 히스토리 버튼 */}
      <Tooltip title={t('history.title')}>
        <IconButton onClick={onHistoryClick} size='small'>
          <HistoryIcon fontSize='small' />
        </IconButton>
      </Tooltip>

      {/* 설정 버튼 */}
      <Tooltip title={t('settings.title')}>
        <IconButton onClick={openSettings} size='small'>
          <SettingsIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
