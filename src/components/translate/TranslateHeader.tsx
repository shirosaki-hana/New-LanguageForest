import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { Settings as SettingsIcon, History as HistoryIcon } from '@mui/icons-material';
import { useSettingsStore } from '../../stores/settingsStore';

interface TranslateHeaderProps {
  onHistoryClick: () => void;
}

export default function TranslateHeader({ onHistoryClick }: TranslateHeaderProps) {
  const { t } = useTranslation();
  const { openSettings } = useSettingsStore();

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
        bgcolor: theme.custom.glassmorphism.medium,
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      })}
    >
      {/* 앱 로고 + 타이틀 */}
      <Box
        component='img'
        src='/favicon-32x32.png'
        alt='Language Forest Logo'
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          flexShrink: 0,
        }}
      />
      <Typography
        variant='subtitle1'
        sx={theme => ({
          fontWeight: 700,
          background: theme.custom.gradient.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          flexShrink: 0,
        })}
      >
        {t('common.appName')}
      </Typography>

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
