import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertForm } from "./AlertForm";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: "test-id", cancelToken: "test-token" }),
  });
});

describe("AlertForm — validation", () => {
  it("shows email error for 'abc'", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText("올바른 이메일 주소를 입력하세요")).toBeInTheDocument();
  });

  it("shows email error for 'abc@'", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "abc@" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText("올바른 이메일 주소를 입력하세요")).toBeInTheDocument();
  });

  it("shows email error for '@domain.com'", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "@domain.com" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText("올바른 이메일 주소를 입력하세요")).toBeInTheDocument();
  });

  it("shows target price error when both targets are empty", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText("항공 또는 호텔 목표 가격 중 하나 이상을 입력하세요")).toBeInTheDocument();
  });

  it("succeeds with flight target price only", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("항공 목표가"), { target: { value: "200000" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText(/알림이 설정되었습니다/)).toBeInTheDocument();
  });

  it("succeeds with hotel target price only", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("호텔 목표가"), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText(/알림이 설정되었습니다/)).toBeInTheDocument();
  });

  it("shows success message after valid submit", async () => {
    render(<AlertForm />);
    fireEvent.change(screen.getByLabelText("이메일 주소"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("항공 목표가"), { target: { value: "150000" } });
    fireEvent.change(screen.getByLabelText("호텔 목표가"), { target: { value: "80000" } });
    fireEvent.click(screen.getByRole("button", { name: "알림 저장" }));
    expect(await screen.findByText(/알림이 설정되었습니다/)).toBeInTheDocument();
  });
});
