import { MatchFormData, MatchEvent, MatchEventValue } from '../../../types';
import { PlayerDTO } from '../../../api/types';
import { applyEventTypeDefaults } from '../../../utils/matchEvents';

export function useMatchEvents(
  formData: MatchFormData,
  setFormData: React.Dispatch<React.SetStateAction<MatchFormData>>,
  setError: (msg: string | null) => void,
  homeTeamPlayers: PlayerDTO[],
  awayTeamPlayers: PlayerDTO[],
) {
  const addEvent = (team: 'home' | 'away') => {
    const newEvent: MatchEvent = {
      eventTime: '',
      eventType: 'goal',
      playerId: '',
      playerName: '',
      jerseyNumber: '',
      description: '',
      teamType: team,
    };
    setFormData(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent],
    }));
    setError(null);
  };

  const removeEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      events: (prev.events || []).filter((_, i) => i !== index),
    }));
    setError(null);
  };

  const updateEvent = (index: number, field: keyof MatchEvent, value: MatchEventValue) => {
    const updatedEvents = [...formData.events];
    let newEvent = { ...updatedEvents[index], [field]: value } as MatchEvent;

    if (field === 'eventType') {
      newEvent = applyEventTypeDefaults(
        updatedEvents[index],
        value as MatchEvent['eventType'],
        updatedEvents,
      );
      if (value !== 'goal') {
        newEvent.assistPlayerId = null;
        newEvent.assistPlayerName = null;
        newEvent.assistJerseyNumber = null;
      }
      if (value !== 'substitution') {
        newEvent.subPlayerId = undefined;
        newEvent.subPlayerName = undefined;
        newEvent.subJerseyNumber = undefined;
      }
    }

    updatedEvents[index] = newEvent;
    setFormData(prev => ({ ...prev, events: updatedEvents }));
    setError(null);
  };

  const handleEventPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);

    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      playerId: player?.id || '',
      playerName: player?.name || '',
      jerseyNumber: player?.jerseyNumber || '',
    };
    setFormData(prev => ({ ...prev, events: updatedEvents }));
    setError(null);
  };

  const handleSubPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);

    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      subPlayerId: player?.id || '',
      subPlayerName: player?.name || '',
      subJerseyNumber: player?.jerseyNumber || '',
    };
    setFormData(prev => ({ ...prev, events: updatedEvents }));
    setError(null);
  };

  const handleAssistPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);

    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      assistPlayerId: player?.id || null,
      assistPlayerName: player?.name || null,
      assistJerseyNumber: player?.jerseyNumber || null,
    };
    setFormData(prev => ({ ...prev, events: updatedEvents }));
    setError(null);
  };

  return {
    addEvent,
    removeEvent,
    updateEvent,
    handleEventPlayerSelect,
    handleSubPlayerSelect,
    handleAssistPlayerSelect,
  };
}
