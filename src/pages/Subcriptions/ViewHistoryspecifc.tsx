import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { downloadExcel } from 'react-export-table-to-excel';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconBell from '../../components/Icon/IconBell';
import IconFile from '../../components/Icon/IconFile';
import IconPrinter from '../../components/Icon/IconPrinter';
import axios from 'axios';
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { useParams, useNavigate } from "react-router-dom";
const col = ['id', 'subNameHistory', 'subPriceHistory', 'userNameF', 'userNameL', 'subName', 'subPrice', 'startDateHistory', 'expireDateHistory'];

const ViewHistoryspecifc = () => {
    const { id } = useParams(); // Get subscription ID from URL
    const dispatch = useDispatch();
    const { token } = useAuthToken();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [rowData, setRowData] = useState([]); // Initializing rowData
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });
    const [totalPrice, setTotalPrice] = useState(0); // State for total price
    useEffect(() => {
        dispatch(setPageTitle('Export Table'));
        // Fetch data from API
        axios.post(`${ServerSetting.serUrl}/api/getSubscriptionHistory`, {
            subId: id
        },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.data.status === 200) {
                    // Process data and set it into rowData
                    const data = response.data.data.map((item: any) => ({
                        id: item._id,
                        subNameHistory: item.subNameHistory,
                        subPriceHistory: item.subPriceHistory,
                        userNameF: item.userIdHistory.userNameF,
                        userNameL: item.userIdHistory.userNameL,
                        userCNIC: item.userIdHistory.userCNIC,
                        subName: item.subIdHistory.subName,
                        subPrice: item.subIdHistory.subPrice,
                        startDateHistory: item.startDateHistory,
                        expireDateHistory: item.expireDateHistory
                    }));
                    setRowData(data);
                    setInitialRecords(data);
                    // Calculate total price
                    const total = data.reduce((sum: any, item: any) => sum + parseFloat(item.subPriceHistory || item.subPrice), 0);
                    setTotalPrice(total);
                }
            })
            .catch(error => {
                console.error("Error fetching subscription history:", error);
            });
    }, [dispatch]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item: any) => {
                return (
                    item.id.toString().includes(search.toLowerCase()) ||
                    item.subNameHistory.toLowerCase().includes(search.toLowerCase()) ||
                    item.subPriceHistory.toLowerCase().includes(search.toLowerCase()) ||
                    item.userNameF.toLowerCase().includes(search.toLowerCase()) ||
                    item.userNameL.toLowerCase().includes(search.toLowerCase()) ||
                    item.subName.toLowerCase().includes(search.toLowerCase()) ||
                    item.userCNIC.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.subPrice.toString().toLowerCase().includes(search.toLowerCase()) ||
                    item.startDateHistory.toLowerCase().includes(search.toLowerCase()) ||
                    item.expireDateHistory.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortStatus]);

    const formatDate = (date: any) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const handleDownloadExcel = () => {
        downloadExcel({
            fileName: 'table',
            sheet: 'react-export-table-to-excel',
            tablePayload: {
                header: col,
                body: rowData,
            },
        });
    };
    const exportTable = (type: any) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'table';

        let newVariable: any;
        newVariable = window.navigator;

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/csv/i) && !newVariable.msSaveOrOpenBlob) {
                var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
                var link = document.createElement('a');
                link.setAttribute('href', data);
                link.setAttribute('download', filename + '.csv');
                link.click();
            } else {
                var blob = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob, filename + '.csv');
                }
            }
        } else if (type === 'print') {
            var rowhtml = '<p>' + filename + '</p>';
            rowhtml +=
                '<table style="width: 100%; " cellpadding="0" cellcpacing="0"><thead><tr style="color: #515365; background: #eff5ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; "> ';
            // eslint-disable-next-line array-callback-return
            columns.map((d: any) => {
                rowhtml += '<th>' + capitalize(d) + '</th>';
            });
            rowhtml += '</tr></thead>';
            rowhtml += '<tbody>';

            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                rowhtml += '<tr>';
                // eslint-disable-next-line array-callback-return
                columns.map((d: any) => {
                    let val = item[d] ? item[d] : '';
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });
            rowhtml +=
                '<style>body {font-family:Arial; color:#495057;}p{text-align:center;font-size:18px;font-weight:bold;margin:15px;}table{ border-collapse: collapse; border-spacing: 0; }th,td{font-size:12px;text-align:left;padding: 4px;}th{padding:8px 4px;}tr:nth-child(2n-1){background:#f7f7f7; }</style>';
            rowhtml += '</tbody></table>';
            var winPrint: any = window.open('', '', 'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
            winPrint.document.write('<title>Print</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        } else if (type === 'txt') {
            let coldelimiter = ',';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            // eslint-disable-next-line array-callback-return
            records.map((item: any) => {
                // eslint-disable-next-line array-callback-return
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/txt/i) && !newVariable.msSaveOrOpenBlob) {
                var data1 = 'data:application/txt;charset=utf-8,' + encodeURIComponent(result);
                var link1 = document.createElement('a');
                link1.setAttribute('href', data1);
                link1.setAttribute('download', filename + '.txt');
                link1.click();
            } else {
                var blob1 = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob1, filename + '.txt');
                }
            }
        }
    };
    const capitalize = (text: any) => {
        return text
            .replace('_', ' ')
            .replace('-', ' ')
            .toLowerCase()
            .split(' ')
            .map((s: any) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    };
    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-outline-success btn-sm m-1">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" onClick={() => exportTable('txt')} className="btn btn-outline-success btn-sm m-1">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            TXT
                        </button>

                        <button type="button" className="btn btn-outline-success btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>

                        <button type="button" onClick={() => exportTable('print')} className="btn btn-outline-success btn-sm m-1">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="datatables">
                    <DataTable

                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '', title: '#', sortable: true, render: (_, index) => <div>{index + 1}</div> },
                            { accessor: 'subNameHistory', title: 'Subscription Name', sortable: true },
                            { accessor: 'subPriceHistory', title: 'Price', sortable: true },
                            {
                                accessor: 'userNameF',
                                title: 'Shop Owner',
                                sortable: true,
                                render: ({ userNameF, userNameL }) => <div>{`${userNameF} ${userNameL}`}</div> // Combining first and last name
                            },
                             { accessor: 'userCNIC', title: 'Owner CNIC', sortable: true },
                            // { accessor: 'subName', title: 'Subscription Name (Plan)', sortable: true },
                            // { accessor: 'subPrice', title: 'Subscription Price', sortable: true },
                            { accessor: 'startDateHistory', title: 'Start Date', sortable: true, render: ({ startDateHistory }) => <div>{formatDate(startDateHistory)}</div> },
                            { accessor: 'expireDateHistory', title: 'Expire Date', sortable: true, render: ({ expireDateHistory }) => <div>{formatDate(expireDateHistory)}</div> },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}

                    />
                </div>
                {/* Display the total price */}
                <br />
                <hr />
                <div className="total-price pt-5 flex justify-end">
                    <p><strong>Total Subscription Price: </strong>{totalPrice.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

export default ViewHistoryspecifc;
