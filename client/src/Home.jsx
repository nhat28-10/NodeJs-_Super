import React from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Link } from 'react-router-dom'

import 'vidstack/styles/base.css'
import 'vidstack/styles/defaults.css'

import { MediaPlayer, MediaOutlet } from '@vidstack/react'

const getGoogleAuthURL = () => {
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env
  const url = `https://accounts.google.com/o/oauth2/v2/auth`
  const query = {
    client_id: VITE_GOOGLE_CLIENT_ID,
    redirect_uri: VITE_GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    prompt: 'consent',
    access_type: 'offline',
  }
  return `${url}?${new URLSearchParams(query)}`
}

const googleOAuthUrl = getGoogleAuthURL()

export default function Home() {
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))
  const profile = JSON.parse(localStorage.getItem('profile')) || {}

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.reload()
  }

  return (
    <>
      <div>
        <img src={viteLogo} className="logo" />
        <img src={reactLogo} className="logo react" />
      </div>

      <h1>Google OAuth 2.0</h1>

      <h2>Video Streaming</h2>
      <video controls width={500}>
        <source src="http://localhost:3000/static/video-stream/vylhctl43lhd9d8b4pd0q8s5n.mp4" />
      </video>

      <h2>HLS Streaming (Vidstack)</h2>
      <MediaPlayer
        title="Sprite Fight"
        src="http://localhost:3000/static/video-hls/XZLM6NsVqBF0gjkgXsr8M/master.m3u8"
        controls
      >
        <MediaOutlet />
      </MediaPlayer>

      <p className="read-the-docs">
        {isAuthenticated ? (
          <>
            <span>Hello my <strong>{profile.email}</strong>, you are logged in</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to={googleOAuthUrl}>Login with Google</Link>
        )}
      </p>
    </>
  )
}
