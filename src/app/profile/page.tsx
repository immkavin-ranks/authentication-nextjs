"use client";
 
import { useSession } from "auth-lib";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
 
export default function Profile() {
  const { userId } = useSession();
  const { data } = useSWR(`/api/user/${userId}`, fetcher)
 
  return (
    <>
      <h1>Profile</h1>
      <div>{data}</div>
    </>
  );
}