import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offersAPI } from '../services/api'

export function useReceivedOffers() {
  return useQuery({
    queryKey: ['receivedOffers'],
    queryFn: () => offersAPI.getReceived().then(r => r.data),
  })
}

export function useSentOffers() {
  return useQuery({
    queryKey: ['sentOffers'],
    queryFn: () => offersAPI.getSent().then(r => r.data),
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => offersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedOffers'] })
      queryClient.invalidateQueries({ queryKey: ['sentOffers'] })
    },
  })
}

export function useAcceptOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => offersAPI.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedOffers'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export function useRejectOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => offersAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedOffers'] })
    },
  })
}
