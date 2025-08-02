'use client';

import { useState, useEffect } from 'react';
import './globals.css';

interface SavedPlaylist {
  name: string;
  songs: string[];
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [songs, setSongs] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [cardCount, setCardCount] = useState(1);
  const [cards, setCards] = useState<string[][]>([]);

  // For marking clicked cells per card
  const [clickedCells, setClickedCells] = useState<{ [cardIndex: number]: Set<number> }>({});

  // Saved playlists loaded from localStorage
  const [savedPlaylists, setSavedPlaylists] = useState<Record<string, SavedPlaylist>>({});
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  // On mount, load saved playlists from localStorage
  useEffect(() => {
    const data = localStorage.getItem('djBingoPlaylists');
    if (data) {
      setSavedPlaylists(JSON.parse(data));
    }
  }, []);

  // Save playlists to localStorage whenever savedPlaylists changes
  useEffect(() => {
    localStorage.setItem('djBingoPlaylists', JSON.stringify(savedPlaylists));
  }, [savedPlaylists]);

  // Load songs from textarea and append unique new songs
  const handleLoadSongs = () => {
    const newSongs = inputText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !songs.includes(s));
    setSongs((prev) => [...prev, ...newSongs]);
    setInputText('');
  };

  // Clear songs and cards
  const handleClearSongs = () => {
    setSongs([]);
    setCards([]);
    setInputText('');
  };

  // Remove song by double click from main song list
  const handleRemoveSong = (index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate unique bingo cards
  const handleGenerateCards = () => {
    if (songs.length < 24) {
      alert('Please load at least 24 unique songs before generating cards.');
      return;
    }
    const newCards = Array.from({ length: cardCount }, () => generateCardUnique(songs));
    setCards(newCards);
    setClickedCells({});
  };

  // Toggle clicked cells on cards
  const toggleCellClick = (cardIndex: number, cellIndex: number) => {
    setClickedCells((prev) => {
      const cardClicks = new Set(prev[cardIndex] || []);
      if (cardClicks.has(cellIndex)) {
        cardClicks.delete(cellIndex);
      } else {
        cardClicks.add(cellIndex);
      }
      return { ...prev, [cardIndex]: cardClicks };
    });
  };

  // Replace a song in a card with a different one on double click
  const handleReplaceSong = (cardIndex: number, cellIndex: number) => {
    if (songs.length === 0) return;

    setCards((prevCards) => {
      const updatedCards = [...prevCards];
      const card = [...updatedCards[cardIndex]];

      // Get available songs not already in card
      const availableSongs = songs.filter(
        (song) => !card.includes(song) && song !== 'FREE'
      );

      if (availableSongs.length === 0) return updatedCards;

      const replacement = availableSongs[Math.floor(Math.random() * availableSongs.length)];
      card[cellIndex] = replacement;
      updatedCards[cardIndex] = card;
      return updatedCards;
    });
  };

  // Save current playlist (name + songs) to localStorage
  const handleSavePlaylist = () => {
    if (!playlistName.trim()) {
      alert('Please enter a playlist name to save.');
      return;
    }
    if (songs.length === 0) {
      alert('No songs to save.');
      return;
    }

    setSavedPlaylists((prev) => ({
      ...prev,
      [playlistName.trim()]: { name: playlistName.trim(), songs: songs },
    }));
    alert(`Playlist "${playlistName.trim()}" saved.`);
    setSelectedPlaylist(playlistName.trim());
  };

  // Load a saved playlist by name
  const handleLoadPlaylist = (name: string) => {
    if (!name || !savedPlaylists[name]) return;
    const playlist = savedPlaylists[name];
    setPlaylistName(playlist.name);
    setSongs(playlist.songs);
    setCards([]);
    setInputText('');
    setSelectedPlaylist(name);
  };

  // Delete a saved playlist
  const handleDeletePlaylist = (name: string) => {
    if (!name || !savedPlaylists[name]) return;
    if (
      window.confirm(`Are you sure you want to delete the playlist "${name}"?`)
    ) {
      const updated = { ...savedPlaylists };
      delete updated[name];
      setSavedPlaylists(updated);
      if (selectedPlaylist === name) {
        setSelectedPlaylist('');
      }
    }
  };

  return (
    <main className="container">
      <h1>DJ Music Bingo</h1>

      <label className="playlist-label" htmlFor="playlist-name">
        Playlist Name:
      </label>
      <div className="playlist-save-container">
        <input
          id="playlist-name"
          type="text"
          placeholder="Enter playlist name"
          className="playlist-input"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
        <button
          onClick={handleSavePlaylist}
          disabled={!playlistName.trim() || songs.length === 0}
          className="save-playlist-button"
          title="Save current playlist and songs"
        >
          Save Playlist As
        </button>
      </div>

      <label htmlFor="saved-playlists">Load Saved Playlist:</label>
      <div className="load-playlist-container">
        <select
          id="saved-playlists"
          value={selectedPlaylist}
          onChange={(e) => handleLoadPlaylist(e.target.value)}
        >
          <option value="">-- Select Playlist --</option>
          {Object.keys(savedPlaylists).map((name) => (
            <option key={name} value={name}>
              {name} ({savedPlaylists[name].songs.length} songs)
            </option>
          ))}
        </select>
        <button
          onClick={() => handleDeletePlaylist(selectedPlaylist)}
          disabled={!selectedPlaylist}
          className="delete-playlist-button"
          title="Delete selected playlist"
        >
          Delete
        </button>
      </div>

      <textarea
        placeholder="Enter songs (one per line)"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <div className="controls">
        <button onClick={handleLoadSongs}>Load Songs</button>
        <button onClick={handleClearSongs}>Clear Songs</button>
      </div>

      <div className="song-list">
        {songs.map((song, i) => (
          <div
            key={i}
            className="song-item"
            onDoubleClick={() => handleRemoveSong(i)}
            title="Double-click to remove this song"
          >
            {song}
          </div>
        ))}
      </div>

      <div className="generate-controls">
        <label htmlFor="card-count">Number of Bingo Cards:</label>
        <input
          id="card-count"
          type="number"
          min={1}
          max={50}
          value={cardCount}
          onChange={(e) =>
            setCardCount(Math.max(1, Math.min(50, Number(e.target.value))))
          }
        />
        <button onClick={handleGenerateCards}>Generate Bingo Cards</button>
      </div>

      <div className="card-grid">
        {cards.map((card, cardIndex) => (
          <div className="bingo-card" key={cardIndex}>
            <h2 className="playlist-title">{playlistName || 'Playlist'}</h2>
            <hr />
            <div className="grid">
              {card.map((song, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`cell ${song === 'FREE' ? 'free' : ''} ${
                    clickedCells[cardIndex]?.has(cellIndex) ? 'clicked' : ''
                  }`}
                  onClick={() => toggleCellClick(cardIndex, cellIndex)}
                  onDoubleClick={() => {
                    if (song !== 'FREE') handleReplaceSong(cardIndex, cellIndex);
                  }}
                  title={
                    song !== 'FREE'
                      ? 'Click to mark/unmark. Double-click to replace this song.'
                      : 'Free space'
                  }
                >
                  {song}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// Helper function: generate unique bingo card with no duplicates and free space in center
function generateCardUnique(songs: string[]): string[] {
  const shuffled = [...songs].sort(() => Math.random() - 0.5);
  const selected: string[] = [];

  for (let i = 0; i < shuffled.length && selected.length < 24; i++) {
    if (!selected.includes(shuffled[i])) {
      selected.push(shuffled[i]);
    }
  }

  selected.splice(12, 0, 'FREE');
  return selected;
}
