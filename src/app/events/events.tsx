"use client";

import {Button, Card, Grid, Input, Pagination, Space, Table} from "antd";
import {useMemo, useState} from "react";
import {Event} from "@/models/events";
import dayjs from "dayjs";
import {SearchOutlined, SortAscendingOutlined, SortDescendingOutlined, PlusOutlined} from "@ant-design/icons";
import Link from "next/link";
import EventDialog from "@/components/event-dialog";

const {useBreakpoint} = Grid;

export function Events({events, userRole, schoolId}: { events: Event[], userRole?: string, schoolId?: string }) {
    const screens = useBreakpoint();

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const pageSize = 10;

    const canAddEvent = userRole === 'leader' || userRole === 'animator' || userRole === 'ADMIN';

    const filteredAndSortedEvents = useMemo(() => {
        const filtered = events.filter((e) =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = filtered.sort((a, b) => {
            const aDate = new Date(a.startDate).getTime();
            const bDate = new Date(b.startDate).getTime();
            return sortAsc ? aDate - bDate : bDate - aDate;
        });
        return sorted;
    }, [events, searchTerm, sortAsc]);

    const paginated = filteredAndSortedEvents.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleEventSuccess = () => {
        setRefreshKey(prev => prev + 1);
        // Refresh the page to get updated events
        window.location.reload();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Termíny</h1>
                {canAddEvent && schoolId && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Pridať termín
                    </Button>
                )}
            </div>

            <Space direction="vertical" style={{width: "100%"}}>
                <Input
                    placeholder="Vyhľadaj podľa názvu..."
                    prefix={<SearchOutlined/>}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    allowClear
                />
                <Button
                    icon={sortAsc ? <SortAscendingOutlined/> : <SortDescendingOutlined/>}
                    onClick={() => setSortAsc((prev) => !prev)}
                >
                    Triediť podľa dátumu: {sortAsc ? "Od najskoršieho" : "Od najnovšieho"}
                </Button>
            </Space>

            {screens.md ? (
                <Table
                    dataSource={paginated}
                    columns={[
                        {
                            title: "Názov", dataIndex: "title", key: "title", render: (_: string, record: Event) => (
                                <Link href={`/events/${record._id}`}>{record.title}</Link>
                            ),
                        },
                        {
                            title: "Od",
                            dataIndex: "startDate",
                            key: "startDate",
                            render: (date: string) => dayjs(date).format("DD.MM.YYYY"),
                        },
                        {
                            title: "Do",
                            dataIndex: "endDate",
                            key: "endDate",
                            render: (date: string) => dayjs(date).format("DD.MM.YYYY"),
                        },
                    ]}
                    pagination={false}
                    rowKey="_id"
                />
            ) : (
                <div className="space-y-4">
                    {paginated.map((event) => (
                        <Link href={`/events/${event._id}`}>
                            <Card key={event._id.toString()} title={event.title}>
                                <p><strong>Od:</strong> {dayjs(event.startDate).format("DD.MM.YYYY")}</p>
                                <p><strong>Do:</strong> {dayjs(event.endDate).format("DD.MM.YYYY")}</p>
                            </Card>

                        </Link>

                    ))}
                </div>
            )}

            <div className="mt-4 flex justify-center">
                <Pagination
                    current={page}
                    total={filteredAndSortedEvents.length}
                    pageSize={pageSize}
                    onChange={setPage}
                    showSizeChanger={false}
                />
            </div>

            {canAddEvent && schoolId && (
                <EventDialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSuccess={handleEventSuccess}
                    schoolId={schoolId}
                />
            )}
        </div>
    );
}
