'use client';

import { subscribeToPush } from '../lib/subscribePush';
import styles from './page.module.css';

export default function Home() {
  return (
      <main className={styles.main}>
        <h1>Subscribe to Push</h1>
        <button
            onClick={() =>
                subscribeToPush('BOjNZBW9hQTTZw1ck3LPxMpCWhIQh65fg6Ymd6OSDTaBn5TV4ep6gEsZTpY0gepiwtvQajp_Y497oRntc6Tf6dc')
            }
        >
          Subscribe to Push
        </button>
      </main>
  );
}
