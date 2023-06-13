import { CloudDownloadOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, PrinterOutlined, AlertOutlined, UploadOutlined } from '@ant-design/icons';
import { Menu, Form, Modal, Input, Select } from 'antd';
import { useState } from 'react';
import newRequest from "../utils/newRequest.js";
const items = [
    {
        label: 'Add New Technology',
        key: '1',
        icon: <PlusOutlined />,
    },
    {
        label: 'Save Tech Radar to Database',
        key: '2',
        icon: <SaveOutlined />,
    },
    {
        label: 'Reset Tech Radar',
        key: '3',
        icon: <DeleteOutlined />,
    },
    {
        label: 'Restore Data From Database',
        key: '4',
        icon: <CloudDownloadOutlined />
    },
    {
        label: 'Print Tech Details',
        key: '5',
        icon: <PrinterOutlined />,
    },
    {
        label: 'Change Background Mode',
        key: '6',
        icon: <AlertOutlined />,
    },

];


const TopMenu = (props) => {
    const [current, setCurrent] = useState('mail');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClearOpen, setIsClearOpen] = useState(false);
    const [isReloadOpen, setIsReloadOpen] = useState(false);
    const [type, setType] = useState('');
    const [importance, setImportance] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState(true);

    const showClearModal = () => {
        setIsClearOpen(true);
    };
    const showModal = () => {
        setIsModalOpen(true);
    };

    const showReloadModal = () => {
        setIsReloadOpen(true);
    }

    const handleOKClear = () => {
        const deleteRadars = async () => {
            try {
                await newRequest.delete(`/radars`);
            } catch (err) { }
        };
        deleteRadars();
        window.location.reload();
        setIsClearOpen(false);
    }

    const handleOKRestore = () => {
        const reloadRadar = async () => {
            try {
                await newRequest.get(`/radars/reload`);
            } catch (err) { }
        };
        reloadRadar();
        window.location.reload();
        setIsReloadOpen(false);
    };

    const handleOk = () => {
        const addRadar = async () => {
            try {
                await newRequest.post(`/radars`, {
                    quadrant: type,
                    ring: importance,
                    label: name,
                    active: 1,
                    moved: 0,
                    desc: null,
                    id: props.entries.length + 1,
                    link: null,
                });
            } catch (err) { }
        };
        addRadar();
        window.location.reload();
        setIsModalOpen(false);
    };

    const handleCancelClear = () => {
        setIsClearOpen(false);
    }

    const handleCancelRestore = () => {
        setIsReloadOpen(false);
    }

    const handleCancel = () => {
        setIsModalOpen(false);
    };



    const onClick = (e) => {
        console.log('click ', e);
        setCurrent(e.key);
        if (e.key === '1') {
            console.log(123123);
            showModal();
        } else if (e.key === '3') {
            showClearModal();
        } else if (e.key === '4') {
            showReloadModal();
        } else if (e.key === '5') {
            /**
             * @method: print the radar content
            */
            // function doPrint() {
            let head_str = "<html><head><title></title></head><body>";
            let foot_str = "</body></html>";
            let older = document.body.innerHTML;
            let new_str_list = [];
            let idx = 0;
            props.entries.forEach((element) => {
                idx++;
                new_str_list.push(
                    `<h1>${idx + "." + element.label}</h1> \n ${element.desc ? element.desc : ""
                    } \n`
                );
            });

            let new_str = new_str_list.join("");
            document.body.innerHTML = head_str + new_str + foot_str;
            window.print();
            document.body.innerHTML = older;
            window.location.reload();
        } else if (e.key === '6') {
            // const printBtn = document.querySelector(".print");
            const body = document.body;
            const radar = document.querySelector("#radar");
            const menu = document.querySelector(".ant-menu");
            // click the button to toggle background
            if (color) {
                body.style.backgroundColor = "rgb(57 82 80)";
                radar.style.backgroundColor = "rgb(57 82 80)";
                menu.style.backgroundColor = "rgb(57 82 80)";
                setColor(false);
            } else {
                body.style.backgroundColor = "#fff";
                radar.style.backgroundColor = "#fff";
                menu.style.backgroundColor = "#fff";
                setColor(true);
            }
        }
    };

    const onTypeChange = (e) => {
        console.log(e, 'e');
        setType(e);
    };

    const onImpoChange = (e) => {
        console.log(e, 'er');
        setImportance(e);
    }

    const onNameChange = (e) => {
        console.log(e.target.value, 'na');
        setName(e.target.value);
    }

    console.log(props, 'props');
    const { Option } = Select;
    return <>
        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
        <Modal title="Reset Tech Radar!" open={isClearOpen} onOk={handleOKClear} onCancel={handleCancelClear} okText={'Reset'}>
            Pay attention to this operation! You will delete all the data!
        </Modal>
        <Modal title="Restore Data From DB" open={isReloadOpen} onOk={handleOKRestore} onCancel={handleCancelRestore} okText={'Reset'}>
            Pay attention to this operation! You will delete all the data!
        </Modal>
        <Modal title="Add New Technology" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
            <Form>
                <Form.Item label="Technology Name">
                    <Input onChange={onNameChange} />
                </Form.Item>
                <Form.Item label="Technology Type">
                    <Select
                        placeholder="Select a technology type"
                        onChange={onTypeChange}
                        allowClear
                    >
                        <Option value="1">Infrastructure</Option>
                        <Option value="2">Datastores</Option>
                        <Option value="3">Data Management</Option>
                        <Option value="0">Languages</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Technology Importance">
                    <Select
                        placeholder="Select a technology importance"
                        onChange={onImpoChange}
                        allowClear
                    >
                        <Option value="0">Adopt</Option>
                        <Option value="1">Trial</Option>
                        <Option value="2">Assess</Option>
                        <Option value="3">Hold</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    </>;
};
export default TopMenu;