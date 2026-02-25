'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Crown, Calendar, Gamepad2, Star, User, Camera, Loader2, X } from 'lucide-react';
import axios from 'axios';
import PropTypes from 'prop-types';

export default function WeekChampionCard({ week }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [championImage, setChampionImage] = useState(week.championImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });

  const finalCharacter = week.winnerCharacters?.[week.winnerCharacters.length - 1] ?? null;
  const backgroundImage = championImage ?? finalCharacter?.image ?? null;

  const handleUploadClick = (e) => {
    e.stopPropagation();
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so el mismo archivo se puede volver a subir
    e.target.value = '';

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.patch(
        `/api/weeks/${week.id}/champion-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setChampionImage(res.data.championImage);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar la foto del campeón?')) return;

    setUploading(true);
    setError(null);

    try {
      await axios.delete(`/api/weeks/${week.id}/champion-image`);
      setChampionImage(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      router.push(`/week/${week.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative h-64 rounded-2xl overflow-hidden border border-border shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl group"
      onClick={() => router.push(`/week/${week.id}`)}
      onKeyDown={handleCardKeyDown}
    >
      {/* Fondo: championImage → personaje → placeholder */}
      {backgroundImage ? (
        <Image
          src={backgroundImage}
          alt={championImage ? `Campeón Semana ${week.weekNumber}` : (finalCharacter?.name ?? '')}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <User className="h-20 w-20 text-muted-foreground" />
        </div>
      )}

      {/* Gradiente overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      {/* Badge semana - arriba izquierda */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20 shadow">
          <Calendar className="h-3 w-3" />
          Semana {week.weekNumber}
        </div>
      </div>

      {/* Fecha - arriba derecha */}
      <div className="absolute top-3 right-3">
        <div className="text-[11px] text-white/70 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          {formatDate(week.startDate)} – {formatDate(week.endDate)}
        </div>
      </div>

      {/* Stats */}
      {(week.winnerPoints !== null || week.winnerMatchesPlayed !== null) && (
        <div className="absolute top-11 left-3 flex gap-1.5 mt-1">
          {week.winnerPoints !== null && (
            <div className="flex items-center gap-1 bg-yellow-400/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-yellow-400/30">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-yellow-300 text-[11px] font-semibold">
                {week.winnerPoints} pts
              </span>
            </div>
          )}
          {week.winnerMatchesPlayed !== null && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <Gamepad2 className="h-3 w-3 text-white/70" />
              <span className="text-white/70 text-[11px]">
                {week.winnerMatchesPlayed} partidas
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info campeón - abajo */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 text-[11px] font-bold uppercase tracking-widest">
            Campeón
          </span>
        </div>
        <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">
          {week.winner.name}
          {week.winnerCharacters?.length > 0 && (
            <span> - {week.winnerCharacters.map((c) => c.name).join(', ')}</span>
          )}
        </p>
      </div>

      {/* Controles de imagen — visibles al hacer hover */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {championImage && !uploading && (
          <button
            onClick={handleDeleteImage}
            title="Eliminar foto"
            className="bg-red-600/80 hover:bg-red-600 backdrop-blur-sm text-white rounded-full p-1.5 shadow transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          title={championImage ? 'Cambiar foto' : 'Subir foto del campeón'}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full p-1.5 shadow transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Camera className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Overlay de carga */}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <span className="text-white text-xs">Subiendo...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-0 left-0 right-0 bg-red-600/90 px-3 py-2 text-white text-xs text-center"
        >
          {error}
        </div>
      )}

      {/* Input file oculto — stopPropagation evita que el click programático burbujee al div padre */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handleFileChange}
      />
    </div>
  );
}

WeekChampionCard.propTypes = {
  week: PropTypes.shape({
    id: PropTypes.number.isRequired,
    weekNumber: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    championImage: PropTypes.string,
    winner: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    winnerCharacters: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        image: PropTypes.string,
        series: PropTypes.string,
      })
    ),
    winnerPoints: PropTypes.number,
    winnerMatchesPlayed: PropTypes.number,
  }).isRequired,
};
