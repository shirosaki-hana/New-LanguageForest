import { useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Typography, TextField, Button, IconButton, CircularProgress, Tooltip, Divider, Chip } from '@mui/material';
import { Translate as TranslateIcon, ContentCopy as CopyIcon, Clear as ClearIcon, Stop as StopIcon } from '@mui/icons-material';
import { useTranslateStore } from '../../stores/translateStore';
import { snackbar } from '../../stores/snackbarStore';

export default function TranslatePanel() {
  const { t } = useTranslation();

  // 스크롤 동기화를 위한 ref
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollSourceRef = useRef<'source' | 'target' | null>(null);
  const {
    sourceText,
    translatedText,
    isTranslating,
    selectedModel,
    isLoadingModels,
    tokenCounts,
    setSourceText,
    translate,
    stopTranslation,
    clearTranslation,
  } = useTranslateStore();

  // 원문 텍스트 카운트 계산
  const sourceStats = useMemo(() => {
    const text = sourceText.trim();
    if (!text) return { characters: 0, words: 0, lines: 0 };

    const characters = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const lines = text.split('\n').length;

    return { characters, words, lines };
  }, [sourceText]);

  // 번역문 텍스트 카운트 계산
  const translatedStats = useMemo(() => {
    const text = translatedText.trim();
    if (!text) return { characters: 0 };

    const characters = text.length;

    return { characters };
  }, [translatedText]);

  // 스크롤 동기화 핸들러 (비율 기반, 양방향)
  const syncScroll = useCallback(
    (source: 'source' | 'target') => {
      // 스트리밍 중에는 동기화 비활성화
      if (isTranslating) return;

      // 무한 루프 방지: 다른 쪽에서 트리거된 스크롤이면 무시
      if (scrollSourceRef.current && scrollSourceRef.current !== source) return;

      const sourceEl = sourceRef.current;
      const targetEl = targetRef.current;

      if (!sourceEl || !targetEl) return;

      scrollSourceRef.current = source;

      if (source === 'source') {
        // 원문 → 번역문 동기화
        const maxScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
        const scrollRatio = maxScroll > 0 ? sourceEl.scrollTop / maxScroll : 0;
        const targetMaxScroll = targetEl.scrollHeight - targetEl.clientHeight;
        targetEl.scrollTop = scrollRatio * targetMaxScroll;
      } else {
        // 번역문 → 원문 동기화
        const maxScroll = targetEl.scrollHeight - targetEl.clientHeight;
        const scrollRatio = maxScroll > 0 ? targetEl.scrollTop / maxScroll : 0;
        const sourceMaxScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
        sourceEl.scrollTop = scrollRatio * sourceMaxScroll;
      }

      // 다음 프레임에서 플래그 해제 (무한 루프 방지)
      requestAnimationFrame(() => {
        scrollSourceRef.current = null;
      });
    },
    [isTranslating]
  );

  const handleSourceScroll = useCallback(() => syncScroll('source'), [syncScroll]);
  const handleTargetScroll = useCallback(() => syncScroll('target'), [syncScroll]);

  // 번역문 복사
  const handleCopy = async () => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      snackbar.success(t('translate.copySuccess'));
    } catch {
      snackbar.error(t('translate.copyError'));
    }
  };

  // 원문 복사
  const handleCopySource = async () => {
    if (!sourceText) return;

    try {
      await navigator.clipboard.writeText(sourceText);
      snackbar.success(t('translate.copySuccess'));
    } catch {
      snackbar.error(t('translate.copyError'));
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* 번역 영역 */}
      <Paper
        elevation={0}
        sx={theme => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(2,6,23,0.55)',
          overflow: 'hidden',
          minHeight: 0,
        })}
      >
        {/* 입력/출력 영역 */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
          divider={<Divider orientation='vertical' flexItem />}
        >
          {/* 원문 입력 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* 입력 영역 */}
            <Box sx={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
              <TextField
                multiline
                fullWidth
                placeholder={t('translate.placeholder')}
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                disabled={isTranslating}
                inputRef={sourceRef}
                slotProps={{
                  htmlInput: {
                    onScroll: handleSourceScroll,
                  },
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  '& .MuiOutlinedInput-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    border: 'none',
                    borderRadius: 0,
                    '& fieldset': { border: 'none' },
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflow: 'auto !important',
                    p: 2,
                  },
                }}
              />
            </Box>
            {/* 카운터 및 액션 버튼 영역 */}
            <Box
              sx={{
                height: 40,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: theme => `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
              }}
            >
              {/* 원문 카운터 */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                {sourceText && (
                  <>
                    <Chip
                      label={`${sourceStats.characters} ${t('translate.characters')}`}
                      size='small'
                      variant='outlined'
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={`${sourceStats.words} ${t('translate.words')}`}
                      size='small'
                      variant='outlined'
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={`${sourceStats.lines} ${t('translate.lines')}`}
                      size='small'
                      variant='outlined'
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                  </>
                )}
              </Box>
              {/* 원문 액션 버튼 */}
              <Stack direction='row' spacing={0.5} sx={{ flexShrink: 0 }}>
                {sourceText && (
                  <>
                    <Tooltip title={t('common.copy')}>
                      <IconButton size='small' onClick={handleCopySource}>
                        <CopyIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.clear')}>
                      <IconButton size='small' onClick={clearTranslation} disabled={isTranslating}>
                        <ClearIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Box>
          </Box>

          {/* 번역문 출력 */}
          <Box
            sx={theme => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              minHeight: 0,
            })}
          >
            {/* 출력 영역 */}
            <Box
              ref={targetRef}
              onScroll={handleTargetScroll}
              sx={{
                flex: 1,
                p: 2,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {isTranslating && !translatedText && (
                <Stack direction='row' alignItems='center' spacing={1} sx={{ color: 'text.secondary' }}>
                  <CircularProgress size={16} />
                  <Typography variant='body2'>{t('translate.translating')}</Typography>
                </Stack>
              )}
              {translatedText && (
                <Typography variant='body1' sx={{ lineHeight: 1.8 }}>
                  {translatedText}
                </Typography>
              )}
              {!isTranslating && !translatedText && (
                <Typography variant='body1' color='text.disabled'>
                  {t('translate.resultPlaceholder')}
                </Typography>
              )}
            </Box>
            {/* 카운터 및 액션 버튼 영역 */}
            <Box
              sx={{
                height: 40,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: theme => `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
              }}
            >
              {/* 번역문 카운터 */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                {translatedText && (
                  <>
                    <Chip
                      label={`${translatedStats.characters} ${t('translate.characters')}`}
                      size='small'
                      variant='outlined'
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                    {tokenCounts && (
                      <>
                        <Chip
                          label={`${tokenCounts.completionTokens} ${t('translate.tokens')}`}
                          size='small'
                          variant='filled'
                          color='primary'
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={`${t('translate.promptTokens')}: ${tokenCounts.promptTokens}`}
                          size='small'
                          variant='outlined'
                          color='secondary'
                          sx={{ height: 24, fontSize: '0.75rem', opacity: 0.7 }}
                        />
                      </>
                    )}
                  </>
                )}
              </Box>
              {/* 번역문 액션 버튼 */}
              <Stack direction='row' spacing={0.5} sx={{ flexShrink: 0 }}>
                {translatedText && (
                  <Tooltip title={t('common.copy')}>
                    <IconButton size='small' onClick={handleCopy}>
                      <CopyIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Paper>

      {/* 번역 버튼 바 */}
      <Box
        sx={theme => ({
          py: 1.5,
          px: 2,
          display: 'flex',
          justifyContent: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(2,6,23,0.7)',
          flexShrink: 0,
        })}
      >
        {isTranslating ? (
          <Button variant='outlined' color='error' onClick={stopTranslation} startIcon={<StopIcon />} sx={{ minWidth: 160 }}>
            {t('translate.stopButton')}
          </Button>
        ) : (
          <Button
            variant='contained'
            onClick={translate}
            disabled={!sourceText.trim() || !selectedModel || isLoadingModels}
            startIcon={<TranslateIcon />}
            sx={{
              minWidth: 160,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
              },
              '&:disabled': {
                background: 'none',
              },
            }}
          >
            {t('translate.translateButton')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
