import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Room } from '@/lib/schema';

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.rooms.getAll(),
  });
}

export function useRoom(roomId: string | undefined) {
  return useQuery<Room>({
    queryKey: ['rooms', roomId],
    queryFn: () => api.rooms.getById(roomId!),
    enabled: !!roomId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; mode?: 'screenshare' | 'watchparty'; videoUrl?: string }) =>
      api.rooms.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUpdateRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; mode?: 'screenshare' | 'watchparty'; videoUrl?: string }) =>
      api.rooms.update(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useJoinRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.rooms.join(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
    },
  });
}

export function useLeaveRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.rooms.leave(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
    },
  });
}

export function useTransferOwnership(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: string) => api.rooms.transfer(roomId, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
    },
  });
}

export function useDeleteRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.rooms.delete(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
