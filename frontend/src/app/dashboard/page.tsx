import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Users, Hash, TrendingUp } from "lucide-react"

export default function DashboardHome() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-dark-green">Welcome to Jammy</h1>
        <p className="text-sage text-lg">Discover your music taste with beautiful analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/top_tracks">
          <Card className="bg-cream border-sage/20 hover:border-gold/40 transition-all duration-200 hover:shadow-lg cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sage">Top Tracks</CardTitle>
              <Music className="h-4 w-4 text-sage group-hover:text-gold transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-green">Your Favorites</div>
              <p className="text-xs text-sage">Discover your most played songs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/top_artists">
          <Card className="bg-cream border-sage/20 hover:border-gold/40 transition-all duration-200 hover:shadow-lg cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sage">Top Artists</CardTitle>
              <Users className="h-4 w-4 text-sage group-hover:text-gold transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-green">Your Artists</div>
              <p className="text-xs text-sage">See who you listen to most</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/top_genres">
          <Card className="bg-cream border-sage/20 hover:border-gold/40 transition-all duration-200 hover:shadow-lg cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sage">Top Genres</CardTitle>
              <Hash className="h-4 w-4 text-sage group-hover:text-gold transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-green">Your Genres</div>
              <p className="text-xs text-sage">Explore your music taste</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-dark-green">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-sage/10 border-sage/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-sage" />
                <div>
                  <p className="text-2xl font-bold text-dark-green">50</p>
                  <p className="text-xs text-sage">Top Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gold/10 border-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-2xl font-bold text-dark-green">50</p>
                  <p className="text-xs text-sage">Top Artists</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-copper/10 border-copper/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-copper" />
                <div>
                  <p className="text-2xl font-bold text-dark-green">25+</p>
                  <p className="text-xs text-sage">Genres</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sage/10 border-sage/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Music className="h-5 w-5 text-sage" />
                <div>
                  <p className="text-2xl font-bold text-dark-green">100%</p>
                  <p className="text-xs text-sage">Music Love</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
