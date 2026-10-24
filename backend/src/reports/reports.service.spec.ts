import { describe, jest, beforeEach, it, expect } from "@jest/globals";
import { ReportsService } from "./reports.service";
import { ReportEntity } from "./entities/report.entity";
import { Test } from "@nestjs/testing";
import { ReportsRulesService } from "./report-rules/reports-rules.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { ReportStatus } from "./enums/report-status.enum";

describe("ReportsServiceTest", () => {
  let service: ReportsService;

  const repositoryMock = {
    find: jest.fn<() => Promise<ReportEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<ReportEntity | null>>(),
    create: jest.fn<(report: Partial<ReportEntity>) => ReportEntity>(),
    save: jest.fn<(report: ReportEntity) => Promise<ReportEntity>>(),
  };

  const reportsRulesServiceMock = {
    ensureCanBeUpdated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(ReportEntity),
          useValue: repositoryMock,
        },
        {
          provide: ReportsRulesService,
          useValue: reportsRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ReportsService);
  });

  it("returns a report when the id exists", async () => {
    const reportMock = {
      id: "uuid-1",
      reason: "No llegó",
      status: ReportStatus.PENDING,
    } as ReportEntity;

    repositoryMock.findOne.mockResolvedValue(reportMock);

    const result = await service.findOne("uuid-1");

    expect(result).toEqual(reportMock);
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "uuid-1" },
      relations: ["reporter"],
    });
  });

  it("throws NotFoundException when the report does not exist", async () => {
    repositoryMock.findOne.mockResolvedValue(null);
    await expect(service.findOne("uuid-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates a report successfully with PENDING status", async () => {
    const dto = {
      reason: "Trabajo mal hecho",
      description: "Dejó todo sucio y la llave gotea.",
      reportedUserId: "uuid-worker",
      requestId: "uuid-request",
    };

    const createdReport = { ...dto, status: ReportStatus.PENDING } as unknown as ReportEntity;
    const savedReport = { ...createdReport, id: "uuid-1" } as ReportEntity;

    repositoryMock.create.mockReturnValue(createdReport);
    repositoryMock.save.mockResolvedValue(savedReport);

    const result = await service.create("uuid-client", dto);

    expect(repositoryMock.save).toHaveBeenCalledWith(createdReport);
    expect(result.id).toEqual("uuid-1");
  });

  it("updates report status and calls rules service", async () => {
    const reportMock = {
      id: "uuid-1",
      status: ReportStatus.PENDING,
    } as ReportEntity;

    const dto = { status: ReportStatus.INVESTIGATING };

    repositoryMock.findOne.mockResolvedValue(reportMock);
    repositoryMock.save.mockResolvedValue({ ...reportMock, status: ReportStatus.INVESTIGATING } as ReportEntity);

    const result = await service.updateStatus("uuid-1", dto);

    expect(reportsRulesServiceMock.ensureCanBeUpdated).toHaveBeenCalledWith(reportMock, ReportStatus.INVESTIGATING);
    expect(repositoryMock.save).toHaveBeenCalled();
    expect(result.status).toEqual(ReportStatus.INVESTIGATING);
  });
});