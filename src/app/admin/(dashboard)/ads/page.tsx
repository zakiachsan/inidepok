import { db, ads, asc } from '@/db'
import AdsManager from './components/AdsManager'

async function getAds() {
  return db.select().from(ads).orderBy(asc(ads.position))
}

export default async function AdsPage() {
  const adsList = await getAds()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Kelola Iklan</h1>
        <p className="text-xs text-gray-500">
          Atur posisi dan tampilan iklan di website
        </p>
      </div>
      <AdsManager initialAds={adsList} />
    </div>
  )
}
