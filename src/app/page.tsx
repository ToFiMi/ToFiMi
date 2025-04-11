'use client';

import { subscribeToPush } from '@/lib/subscribePush';
import styles from './page.module.css';

export default function Home() {
  return (
      <main className={styles.main}>
        <h1>Subscribe to Push</h1>
        <button
            onClick={() =>
                subscribeToPush(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            }
        >
          Subscribe to Push
        </button>
      </main>
  );
}
