import { NextResponse } from 'next/server';
import coursesData from '@/data/courses.js';

interface Course {
  id: number | string;
  name: string;
  price: number;
  seat: number;
  booked: number;
  date: string;
  tags: string[];
}

const courses: Course[] = coursesData;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, course, name, phone, people } = body;

    // 1. 필수 입력값 검증 (이름이 비어있거나 공백인 경우 차단)
    const trimmedName = String(name || '').trim();
    const trimmedPhone = String(phone || '').trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: '예약자 성함을 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (!trimmedPhone) {
      return NextResponse.json(
        { error: '연락처(휴대폰 번호)를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const peopleCount = Number(people) || 1;
    if (peopleCount < 1) {
      return NextResponse.json(
        { error: '신청 인원은 1명 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 2. 강좌 데이터 조회 (courseId 또는 course명으로 검색)
    const targetCourse = courses.find(
      (c) =>
        (courseId !== undefined && String(c.id) === String(courseId)) ||
        c.name === course
    );

    if (!targetCourse) {
      return NextResponse.json(
        { error: '존재하지 않는 강좌입니다.' },
        { status: 400 }
      );
    }

    // 인원이 남은 자리보다 많은 경우 차단
    const remainingSeats = targetCourse.seat - targetCourse.booked;
    if (peopleCount > remainingSeats) {
      return NextResponse.json(
        { error: `신청 인원(${peopleCount}명)이 남은 자리(${remainingSeats}석)보다 많습니다.` },
        { status: 400 }
      );
    }

    // 3. 결제 금액(total)은 클라이언트가 보낸 값이 아닌 서버 데이터(수강료 × 인원)로 직접 계산
    const calculatedTotal = targetCourse.price * peopleCount;
    const courseDate = targetCourse.date || body.date || '';
    const courseName = targetCourse.name;

    // 4. .env의 SHEET_URL 환경변수 확인 (브라우저에 노출되지 않는 서버 환경변수)
    const sheetUrl = process.env.SHEET_URL;
    if (!sheetUrl) {
      console.error('SHEET_URL 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류: 구글 시트 연동 주소가 없습니다.' },
        { status: 500 }
      );
    }

    // 5. 구글 시트 Apps Script로 전송할 JSON 페이로드 구성
    const payload = {
      date: courseDate,
      course: courseName,
      name: String(name).trim(),
      phone: String(phone).trim(),
      people: peopleCount,
      total: calculatedTotal,
    };

    // 6. 구글 스프레드시트 Apps Script로 서버 사이드 POST 전송
    const sheetResponse = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text().catch(() => '');
      console.error('구글 시트 응답 실패:', sheetResponse.status, errorText);
      return NextResponse.json(
        { error: '구글 시트 전송 중 오류가 발생했습니다.' },
        { status: 502 }
      );
    }

    const responseData = await sheetResponse.json().catch(async () => {
      return { result: 'ok' };
    });

    return NextResponse.json({
      result: 'ok',
      data: responseData,
      calculatedTotal,
    });
  } catch (err: unknown) {
    console.error('예약 처리 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
