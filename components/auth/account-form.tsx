"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/account/actions";
import type { Profile } from "@/app/account/actions";

export function AccountForm({ email, profile }: { email: string; profile: Profile | null }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [height, setHeight] = useState(profile?.height_cm != null ? String(profile.height_cm) : "");
  const [weight, setWeight] = useState(profile?.weight_kg != null ? String(profile.weight_kg) : "");
  const [profileMessage, setProfileMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);
    const res = await updateProfile({
      nickname: nickname.trim() || null,
      gender: gender.trim() || null,
      height_cm: height.trim() ? Number(height) : null,
      weight_kg: weight.trim() ? Number(weight) : null,
    });
    setProfileLoading(false);
    if (res.error) {
      setProfileMessage({ type: "error", text: res.error });
      return;
    }
    setProfileMessage({ type: "ok", text: "회원 정보가 저장되었습니다." });
    router.refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (password !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "비밀번호가 일치하지 않습니다." });
      return;
    }
    if (password.length < 6) {
      setPasswordMessage({ type: "error", text: "비밀번호는 6자 이상이어야 합니다." });
      return;
    }
    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordLoading(false);
    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
      return;
    }
    setPasswordMessage({ type: "ok", text: "비밀번호가 변경되었습니다." });
    setPassword("");
    setConfirmPassword("");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "탈퇴") {
      setDeleteMessage('탈퇴하려면 입력란에 "탈퇴"를 정확히 입력하세요.');
      return;
    }
    setDeleteMessage(null);
    setDeleteLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.deleteUser();
    setDeleteLoading(false);
    if (error) {
      setDeleteMessage(error.message);
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">이메일</p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{email}</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          회원 정보 수정
        </h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">닉네임</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="닉네임"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">성별</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">선택</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">키 (cm)</span>
          <input
            type="number"
            min={1}
            max={300}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="키"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">몸무게 (kg)</span>
          <input
            type="number"
            min={1}
            max={500}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="몸무게"
          />
        </label>
        {profileMessage && (
          <p
            className={`text-sm ${
              profileMessage.type === "ok"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {profileMessage.text}
          </p>
        )}
        <button
          type="submit"
          disabled={profileLoading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {profileLoading ? "저장 중…" : "저장"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          비밀번호 변경
        </h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">새 비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">새 비밀번호 확인</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        {passwordMessage && (
          <p
            className={`text-sm ${
              passwordMessage.type === "ok"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {passwordMessage.text}
          </p>
        )}
        <button
          type="submit"
          disabled={passwordLoading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {passwordLoading ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>

      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
          계정 탈퇴
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="탈퇴"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {deleteMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">{deleteMessage}</p>
          )}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="w-fit rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {deleteLoading ? "처리 중…" : "계정 탈퇴"}
          </button>
        </div>
      </div>

      <p>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          ← 메인으로
        </Link>
      </p>
    </div>
  );
}
