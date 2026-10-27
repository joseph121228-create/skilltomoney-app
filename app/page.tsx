'use client';

import { useState } from 'react';
import coursesData from '../data/courses.js';

interface Course {
  id: number | string;
  name: string;
  price: number;
  seat: number;
  booked: number;
  date: string;
  tags: string[];
}

// 강좌별 아이콘 매핑
const COURSE_ICONS: Record<string, string> = {
  'AI 자동화': '🤖',
  '숏폼 편집': '🎬',
  '엑셀 실무': '📊',
  '스마트스토어': '🛍️',
};

// data/courses.js에서 불러온 강좌 목록 사용
const courses: Course[] = coursesData;

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [personCount, setPersonCount] = useState<number>(1);
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [instructorModalOpen, setInstructorModalOpen] = useState<boolean>(false);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  const filteredCourses = courses.filter((course) => {
    if (onlyAvailable) {
      return course.seat - course.booked > 0;
    }
    return true;
  });

  const handleOpenReservation = (course: Course) => {
    const remainingSeats = course.seat - course.booked;
    if (remainingSeats <= 0) {
      return;
    }
    setSelectedCourse(course);
    setPersonCount(1);
    setUserName('');
    setUserPhone('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setSelectedCourse(null);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || isSubmitting) return;

    const remainingSeats = selectedCourse.seat - selectedCourse.booked;

    // 1) 이름이 비어 있는 경우 검증
    if (!userName.trim()) {
      setSubmitError('예약자 성함을 입력해 주세요.');
      return;
    }

    // 2) 연락처가 비어 있는 경우 검증
    if (!userPhone.trim()) {
      setSubmitError('연락처(휴대폰 번호)를 입력해 주세요.');
      return;
    }

    // 3) 인원이 남은 자리보다 많은 경우 검증
    if (personCount > remainingSeats) {
      setSubmitError(
        `신청 인원(${personCount}명)이 남은 자리(${remainingSeats}석)보다 많습니다.`
      );
      return;
    }

    if (personCount < 1) {
      setSubmitError('신청 인원은 최소 1명 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          course: selectedCourse.name,
          date: selectedCourse.date,
          name: userName.trim(),
          phone: userPhone.trim(),
          people: personCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.result !== 'ok') {
        throw new Error(data.error || '예약 처리 중 오류가 발생했습니다.');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : '예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2b4c] text-white flex flex-col justify-between selection:bg-[#d4af37] selection:text-[#1a2b4c]">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 헤더 섹션: 1장의 소개 페이지와 동일한 남색·금색 브랜딩 */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#d4af37] tracking-wider mb-3 drop-shadow-[2px_2px_8px_rgba(0,0,0,0.45)]">
            스킬투머니
          </h1>
          <p className="text-lg sm:text-xl text-[#e2e8f0] font-light max-w-2xl mx-auto leading-relaxed">
            배운 기술을 돈으로, <span className="font-semibold text-white">원데이 강좌 목록</span>
          </p>
          <div className="w-20 h-1 bg-[#d4af37] mx-auto mt-5 rounded-full opacity-80" />
        </header>

        {/* 강좌 목록 위: 예약 가능한 강좌만 보기 체크 상자 */}
        <div className="flex justify-end items-center mb-6">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[#e2e8f0] bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-[#d4af37]/40 hover:border-[#d4af37] transition-all select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 accent-[#d4af37] cursor-pointer"
            />
            <span>예약 가능한 강좌만 보기</span>
          </label>
        </div>

        {/* data/courses.js에서 불러온 4개 강좌 목록 카드 그리드 */}
        <section aria-label="강좌 목록" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {filteredCourses.map((course) => {
            const remainingSeats = course.seat - course.booked;
            const isFull = remainingSeats === 0;
            const isImminent = remainingSeats >= 1 && remainingSeats <= 2;
            const icon = COURSE_ICONS[course.name] || '💡';

            return (
              <article
                key={course.id}
                className={`bg-white rounded-[20px] p-6 text-[#333333] shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col justify-between border ${
                  isFull
                    ? 'border-slate-200 opacity-95'
                    : isImminent
                    ? 'border-red-300 ring-2 ring-red-400/30 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'
                    : 'border-[#e2e8f0]/40 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]'
                }`}
              >
                <div>
                  {/* 상단 태그 및 아이콘 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-2xl shadow-sm">
                      {icon}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end items-center">
                      {/* 상태 배지: 남은 좌석 0이면 "마감", 1~2석이면 "마감 임박"(빨간색), 그 외 신청 가능 */}
                      {isFull && (
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-300">
                          마감
                        </span>
                      )}
                      {isImminent && (
                        <span className="bg-red-50 text-red-600 text-xs font-extrabold px-2.5 py-1 rounded-full border border-red-300 animate-pulse">
                          마감 임박
                        </span>
                      )}
                      {!isFull && !isImminent && (
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                          신청 가능
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 강좌 이름 */}
                  <h2 className="text-xl font-bold text-[#1a2b4c] mb-2 tracking-tight">
                    {course.name}
                  </h2>

                  {/* 태그 목록 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#f1f5f9] text-[#475569] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#e2e8f0]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 강좌 상세 정보 */}
                  <div className="space-y-2.5 mb-5 text-sm text-[#444444] border-t border-b border-[#f1f5f9] py-3.5">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-[#f8fafc] flex items-center justify-center text-xs mr-2 shrink-0">
                        📅
                      </span>
                      <span>{course.date}</span>
                    </div>

                    {/* 남은 좌석 ○석 / 정원 ○명 표시 (남은 좌석 = 정원 - 예약) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-[#f8fafc] flex items-center justify-center text-xs mr-2 shrink-0">
                          👥
                        </span>
                        <span className="font-semibold text-[#1a2b4c] text-xs sm:text-sm">
                          남은 좌석 {remainingSeats}석 / 정원 {course.seat}명
                        </span>
                      </div>

                      {/* 남은 좌석 0이면 "마감", 1~2석이면 빨간색 "마감 임박" 표시 */}
                      {isFull && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-300 shrink-0">
                          마감
                        </span>
                      )}
                      {isImminent && (
                        <span className="text-xs font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-300 shrink-0">
                          마감 임박
                        </span>
                      )}
                    </div>

                    {/* 좌석 현황 프로그레스 바 */}
                    <div className="w-full bg-[#f1f5f9] rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-slate-400'
                            : isImminent
                            ? 'bg-red-500'
                            : 'bg-[#d4af37]'
                        }`}
                        style={{ width: `${Math.min(100, (course.booked / course.seat) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 수강료 및 버튼 */}
                <div className="pt-2">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs font-medium text-[#64748b]">수강료</span>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[#1a2b4c]">
                        {course.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 남은 좌석이 0이면 [예약 마감] 버튼으로 바뀌고 비활성화(disabled)되어 누를 수 없음 */}
                  {isFull ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#e2e8f0] text-[#94a3b8] border border-[#cbd5e1] cursor-not-allowed select-none"
                    >
                      예약 마감
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenReservation(course)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-[#1a2b4c] bg-[#d4af37] hover:bg-[#f1c40f] hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_20px_rgba(241,196,15,0.45)] transition-all duration-200 cursor-pointer"
                    >
                      예약하기
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* 1장 소개 페이지 감성의 하단 강사 모집 섹션 */}
        <footer className="mt-16 md:mt-20 pt-8 border-t border-white/20 text-center">
          <p className="text-base sm:text-lg text-[#e2e8f0] mb-4">
            나도 가르칠 수 있는 기술이 있다면?
          </p>
          <button
            type="button"
            onClick={() => setInstructorModalOpen(true)}
            className="px-8 py-3 rounded-full text-sm sm:text-base font-bold bg-transparent border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1a2b4c] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
          >
            내 기술로 강좌 열기
          </button>
        </footer>
      </main>

      {/* 예약하기 모달 (Modal) */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white text-[#333333] rounded-[24px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#1a2b4c] text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>

            {!isSubmitted ? (
              <>
                <div className="mb-6">
                  <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider bg-[#1a2b4c] px-2.5 py-1 rounded-md">
                    강좌 예약
                  </span>
                  <h3 className="text-2xl font-bold text-[#1a2b4c] mt-2">
                    {selectedCourse.name}
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">
                    {selectedCourse.date} · 1인 {selectedCourse.price.toLocaleString()}원
                  </p>
                  <p className="text-xs text-[#d4af37] font-semibold mt-1">
                    남은 좌석 {selectedCourse.seat - selectedCourse.booked}석 / 정원 {selectedCourse.seat}명
                  </p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* 인원 선택 (남은 좌석 수까지 선택 가능) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-semibold text-[#1a2b4c]">
                        신청 인원
                      </label>
                      <span className="text-xs text-[#64748b]">
                        최대 {selectedCourse.seat - selectedCourse.booked}명 신청 가능
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPersonCount((prev) => Math.max(1, prev - 1));
                          if (submitError) setSubmitError(null);
                        }}
                        className="w-10 h-10 rounded-lg border border-[#cbd5e1] font-bold text-lg text-[#1a2b4c] hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-lg font-bold text-[#1a2b4c]">
                        {personCount}명
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPersonCount((prev) =>
                            Math.min(selectedCourse.seat - selectedCourse.booked, prev + 1)
                          );
                          if (submitError) setSubmitError(null);
                        }}
                        className="w-10 h-10 rounded-lg border border-[#cbd5e1] font-bold text-lg text-[#1a2b4c] hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 예약자 성함 */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1a2b4c] mb-1.5">
                      예약자 성함
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="홍길동"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        if (submitError) setSubmitError(null);
                      }}
                      className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:border-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c]"
                    />
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1a2b4c] mb-1.5">
                      연락처 (휴대폰 번호)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="010-1234-5678"
                      value={userPhone}
                      onChange={(e) => {
                        setUserPhone(e.target.value);
                        if (submitError) setSubmitError(null);
                      }}
                      className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:border-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c]"
                    />
                  </div>

                  {/* 총 결제 예정 금액 */}
                  <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] mt-4">
                    <div className="flex justify-between items-center text-sm text-[#64748b] mb-1">
                      <span>수강료 합계</span>
                      <span>{(selectedCourse.price * personCount).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-[#1a2b4c] pt-2 border-t border-[#e2e8f0]">
                      <span>최종 결제 금액</span>
                      <span className="text-[#1a2b4c]">
                        {(selectedCourse.price * personCount).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 에러 메시지 알림 */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm rounded-xl p-3 font-medium">
                      ⚠️ {submitError}
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full mt-4 py-3.5 px-6 rounded-xl font-bold text-base text-[#1a2b4c] bg-[#d4af37] hover:bg-[#f1c40f] transition-all shadow-[0_4px_15px_rgba(212,175,55,0.35)] cursor-pointer flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-[#1a2b4c] border-t-transparent rounded-full animate-spin" />
                        <span>저장 중...</span>
                      </>
                    ) : (
                      '예약 완료하기'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl mx-auto flex items-center justify-center mb-4">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-[#1a2b4c] mb-2">
                  예약 신청이 완료되었습니다
                </h3>
                <p className="text-sm text-[#555555] mb-6 leading-relaxed">
                  <strong className="text-[#1a2b4c]">{selectedCourse.name}</strong> ({personCount}명) 강좌 예약 안내 문자가{' '}
                  <strong className="text-[#1a2b4c]">{userPhone || '입력하신 번호'}</strong>(으)로 발송됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 px-6 rounded-xl font-bold text-[#1a2b4c] bg-[#d4af37] hover:bg-[#f1c40f] transition-colors cursor-pointer"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 강사 등록 안내 모달 */}
      {instructorModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setInstructorModalOpen(false)}
        >
          <div
            className="bg-white text-[#333333] rounded-[24px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInstructorModalOpen(false)}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#1a2b4c] text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-[#1a2b4c] text-[#d4af37] text-2xl mx-auto flex items-center justify-center mb-4">
              ✨
            </div>
            <h3 className="text-2xl font-bold text-[#1a2b4c] mb-2">
              강사 지원하기
            </h3>
            <p className="text-sm text-[#555555] mb-6 leading-relaxed">
              본인만의 실전 노하우나 업무 스킬을 공유하고 수익을 만들어보세요. 스킬투머니에서 개설을 도와드립니다.
            </p>
            <button
              type="button"
              onClick={() => setInstructorModalOpen(false)}
              className="w-full py-3 px-6 rounded-xl font-bold text-[#1a2b4c] bg-[#d4af37] hover:bg-[#f1c40f] transition-colors cursor-pointer"
            >
              지원 신청 준비 중
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
