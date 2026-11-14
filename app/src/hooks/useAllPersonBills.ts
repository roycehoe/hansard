import { useGetPersonBills } from '@/api/people/getPersonBills'
import { useEffect } from 'react'

export function useAllPersonBills(personId: number) {
  const bills = useGetPersonBills({ person_id: personId })
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = bills

  useEffect(
    function fetchEveryBillPage() {
      if (!hasNextPage || isFetching || isFetchNextPageError) return
      void fetchNextPage({ cancelRefetch: false })
    },
    [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]
  )

  return { bills }
}
