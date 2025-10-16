import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Message } from '@/lib/schema';

export function useMessages(roomId: string | undefined) {
  return useQuery<Message[]>({
    queryKey: ['rooms', roomId, 'messages'],
    queryFn: () => api.messages.getByRoomId(roomId!),
    enabled: !!roomId,
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { content: string; type?: 'text' | 'gif' | 'system'; gifUrl?: string }) =>
      api.messages.send(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'messages'] });
    },
  });
}
