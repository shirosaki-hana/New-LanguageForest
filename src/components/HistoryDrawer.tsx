/**
 * 번역 히스토리 Drawer 컴포넌트
 */

import { useTranslation } from 'react-i18next';
import { Drawer, Box, Typography, IconButton, List, ListItemButton, ListItemText, Stack, Divider, Tooltip } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, DeleteSweep as ClearAllIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { useHistoryStore, type TranslationHistoryItem } from '../stores/historyStore';
import { useDialogStore } from '../stores/dialogStore';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectHistory: (item: TranslationHistoryItem) => void;
}

export default function HistoryDrawer({ open, onClose, onSelectHistory }: HistoryDrawerProps) {
  const { t } = useTranslation();
  const { history, removeHistory, clearHistory } = useHistoryStore();
  const { showConfirm } = useDialogStore();

  // 날짜 포맷
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 텍스트 미리보기 (최대 50자)
  const truncateText = (text: string, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleSelect = (item: TranslationHistoryItem) => {
    onSelectHistory(item);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeHistory(id);
  };

  const handleClearAll = async () => {
    const confirmed = await showConfirm(t('history.clearConfirm'));
    if (confirmed) {
      clearHistory();
    }
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant='h6' fontWeight={600}>
            {t('history.title')}
          </Typography>
          <Stack direction='row' spacing={1}>
            {history.length > 0 && (
              <Tooltip title={t('history.clearAll')}>
                <IconButton size='small' onClick={handleClearAll} color='error'>
                  <ClearAllIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* 히스토리 목록 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {history.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
              }}
            >
              <Typography color='text.secondary' textAlign='center'>
                {t('history.empty')}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {history.map((item, index) => (
                <Box key={item.id}>
                  <ListItemButton
                    onClick={() => handleSelect(item)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover .delete-btn': { opacity: 1 },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction='row' alignItems='center' spacing={0.5}>
                          {item.title && <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />}
                          <Typography
                            variant='body2'
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: item.title ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {item.title || truncateText(item.sourceText, 30)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {truncateText(item.sourceText, 40)}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            → {truncateText(item.translatedText, 40)}
                          </Typography>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            <Typography variant='caption' color='text.disabled'>
                              {item.modelName}
                            </Typography>
                            <Typography variant='caption' color='text.disabled'>
                              •
                            </Typography>
                            <Typography variant='caption' color='text.disabled'>
                              {formatDate(item.createdAt)}
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                    />
                    <Tooltip title={t('history.delete')}>
                      <IconButton
                        className='delete-btn'
                        size='small'
                        onClick={e => handleDelete(e, item.id)}
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          ml: 1,
                        }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </ListItemButton>
                  {index < history.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
