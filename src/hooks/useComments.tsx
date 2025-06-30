// hooks/useComments.ts
import useSWR from "swr";

export function useComments(entity: string, entityId: string) {
    const url = `/api/comments/${entity}/${entityId}`;
    const { data, mutate, isLoading, error } = useSWR(url, (u) => fetch(u).then((r) => r.json()));

    const add = async (content: string) => {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        mutate(); // revaliduj
    };

    return { comments: data ?? [], add, isLoading, error };
}
