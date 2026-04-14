import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { listingsAPI } from '../services/api'

export function useListings(params) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => listingsAPI.getAll(params).then(r => r.data),
  })
}

export function useInfiniteListings(filters) {
  // page ni params dan olib tashlaymiz — infinite query o'zi boshqaradi
  const { page: _p, ...rest } = filters || {}
  return useInfiniteQuery({
    queryKey: ['listings-infinite', rest],
    queryFn: ({ pageParam = 1 }) =>
      listingsAPI.getAll({ ...rest, page: pageParam, per_page: 12 }).then(r => r.data),
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination
      if (!p) return undefined
      return p.has_next ? p.page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

export function useListing(id) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsAPI.getOne(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useMyListings(params) {
  return useQuery({
    queryKey: ['myListings', params],
    queryFn: () => listingsAPI.getMy(params).then(r => r.data),
  })
}

export function useCreateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => listingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['myListings'] })
    },
  })
}

export function useDeleteListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => listingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['myListings'] })
    },
  })
}
