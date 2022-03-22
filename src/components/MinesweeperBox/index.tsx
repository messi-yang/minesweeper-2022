import { useEffect, useState, useCallback, memo } from 'react';
import Minesweeper, { Field, Status, EventType } from '@/lib/minesweeper';
import WrapperComp from './Wrapper';
import PanelComp, { Status as PanelStatus } from './Panel';
import MinefieldComp, { Minefield } from './Minefield';

/**
 * Convert Status in minesweeper to PanelStatus used in Panel Component.
 * @param status Status
 * @returns PanelStatus
 */
function convertStatusToPanelStatus(status: Status): PanelStatus {
  switch (status) {
    case 'FAILED':
      return PanelStatus.Failed;
    case 'STARTED':
      return PanelStatus.Started;
    case 'SLEEPING':
      return PanelStatus.Sleeing;
    default:
      return PanelStatus.Succeeded;
  }
}

/**
 * Convert Field in minesweeper to Minefield used in Minefield Component.
 * @param field Field
 * @returns Minefield
 */
function converFieldToMinefield(field: Field): Minefield {
  return field.map((areas) =>
    areas.map((area) => ({
      x: area.coord[0],
      y: area.coord[1],
      revealed: area.revealed,
      hasMines: area.hasMines,
      adjMinesCount: area.adjMinesCount,
      boomed: area.boomed,
      flagged: area.flagged,
    }))
  );
}

type Props = {
  size: { width: number; height: number };
  minesCount: number;
};

const MemoMinefieldComp = memo(MinefieldComp);

const MinesweeperBox = function MinesweeperBox({ size, minesCount }: Props) {
  const [minesweeper, setMinesweeper] = useState<Minesweeper | null>(null);
  const [minefield, setMinefield] = useState<Minefield>([]);
  const [gameDuration, setGameDuration] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<PanelStatus>(0);

  const onAreaClick = useCallback(
    (x: number, y: number): any => {
      if (!minesweeper) {
        return;
      }
      const progress = minesweeper.revealArea([x, y]);
      setMinefield(converFieldToMinefield(progress.field));
      setGameStatus(convertStatusToPanelStatus(progress.status));
    },
    [minesweeper]
  );

  const onAreaContextmenu = useCallback(
    (x: number, y: number): any => {
      if (!minesweeper) {
        return;
      }
      let progress = minesweeper.getProgress();
      const { flagged } = progress.field[x][y];
      if (flagged) {
        progress = minesweeper.unflagArea([x, y]);
      } else {
        progress = minesweeper.flagArea([x, y]);
      }
      setMinefield(converFieldToMinefield(progress.field));
    },
    [minesweeper]
  );

  const onResetClick = useCallback(() => {
    if (!minesweeper) {
      return;
    }
    const progress = minesweeper.reset();
    setMinefield(converFieldToMinefield(progress.field));
    setGameStatus(convertStatusToPanelStatus(progress.status));
  }, [minesweeper]);

  const onDurationChange = useCallback((d: number) => {
    setGameDuration(d);
  }, []);

  useEffect(() => {
    const newMinesweeper = new Minesweeper(size, minesCount);
    const progress = newMinesweeper.getProgress();
    newMinesweeper.subscribe(EventType.DurationChange, onDurationChange);
    setMinesweeper(newMinesweeper);
    setGameDuration(progress.duration);
    setMinefield(converFieldToMinefield(progress.field));
    setGameStatus(convertStatusToPanelStatus(progress.status));

    return () => {
      if (minesweeper) {
        minesweeper.destroy();
      }
    };
  }, [size, minesCount]);

  return (
    <WrapperComp
      panel={
        <PanelComp
          status={gameStatus}
          minesCount={minesCount}
          duration={gameDuration}
          onResetClick={onResetClick}
        />
      }
      minefield={
        <MemoMinefieldComp
          minefield={minefield}
          onAreaClick={onAreaClick}
          onAreaContextmenu={onAreaContextmenu}
        />
      }
    />
  );
};

export default MinesweeperBox;
